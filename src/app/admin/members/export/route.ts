import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";
import {
  MEMBER_LEVEL_VALUES,
  MEMBER_STATUS_VALUES,
  type MemberLevel,
  type MemberStatus,
} from "@/lib/format";

// CSV export for /admin/members.
//
// The members list page filters via ?q / ?level / ?status / ?sort / ?dir
// — this route honours those exactly so what you see is what you
// export. Selected columns ride in ?cols=key1,key2,... (order in the
// CSV mirrors the order in `cols`). Selection-aware export is not
// supported yet; selection is purely client state on the list page.

type ColKey =
  | "first_name"
  | "last_name"
  | "name_combined"
  | "nickname"
  | "email"
  | "phone"
  | "street"
  | "city"
  | "state"
  | "postal_code"
  | "birthday"
  | "sex"
  | "level"
  | "status"
  | "member_since"
  | "emergency_contact_name"
  | "emergency_contact_relationship"
  | "emergency_phone"
  | "waiver_signed_at"
  | "physical_limitations"
  | "prior_experience"
  | "found_us_via"
  | "expectations"
  | "bio"
  | "photo_url"
  | "photo_public"
  | "qr_issued_at"
  | "qr_emailed_at"
  | "qr_token";

type MemberRow = {
  first_name: string;
  last_name: string;
  nickname: string | null;
  email: string;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  birthday: string | null;
  sex: string | null;
  level: MemberLevel;
  status: MemberStatus;
  bio: string | null;
  photo_url: string | null;
  photo_public: boolean | null;
  physical_limitations: string | null;
  prior_experience: string | null;
  found_us_via: string | null;
  expectations: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_phone: string | null;
  waiver_signed_at: string | null;
  created_at: string;
  qr_token: string | null;
  qr_issued_at: string | null;
  qr_emailed_at: string | null;
};

export const COLUMNS: Record<
  ColKey,
  { label: string; get: (m: MemberRow) => string }
> = {
  name_combined: {
    label: "Name",
    get: (m) => `${m.last_name}, ${m.first_name}`,
  },
  first_name: { label: "First name", get: (m) => m.first_name },
  last_name: { label: "Last name", get: (m) => m.last_name },
  nickname: { label: "Nickname", get: (m) => m.nickname ?? "" },
  email: { label: "Email", get: (m) => m.email },
  phone: { label: "Phone", get: (m) => m.phone ?? "" },
  street: { label: "Street", get: (m) => m.street ?? "" },
  city: { label: "City", get: (m) => m.city ?? "" },
  state: { label: "State", get: (m) => m.state ?? "" },
  postal_code: { label: "ZIP", get: (m) => m.postal_code ?? "" },
  birthday: { label: "Birthday", get: (m) => m.birthday ?? "" },
  sex: { label: "Sex", get: (m) => m.sex ?? "" },
  level: { label: "Level", get: (m) => m.level },
  status: { label: "Status", get: (m) => m.status },
  member_since: {
    label: "Member since",
    get: (m) => (m.created_at ? m.created_at.slice(0, 10) : ""),
  },
  emergency_contact_name: {
    label: "Emergency contact name",
    get: (m) => m.emergency_contact_name ?? "",
  },
  emergency_contact_relationship: {
    label: "Emergency relationship",
    get: (m) => m.emergency_contact_relationship ?? "",
  },
  emergency_phone: {
    label: "Emergency phone",
    get: (m) => m.emergency_phone ?? "",
  },
  waiver_signed_at: {
    label: "Waiver signed",
    get: (m) => (m.waiver_signed_at ? m.waiver_signed_at.slice(0, 10) : ""),
  },
  physical_limitations: {
    label: "Physical limitations",
    get: (m) => m.physical_limitations ?? "",
  },
  prior_experience: {
    label: "Prior experience",
    get: (m) => m.prior_experience ?? "",
  },
  found_us_via: { label: "Found us via", get: (m) => m.found_us_via ?? "" },
  expectations: { label: "Expectations", get: (m) => m.expectations ?? "" },
  bio: { label: "Bio", get: (m) => m.bio ?? "" },
  photo_url: { label: "Photo URL", get: (m) => m.photo_url ?? "" },
  photo_public: {
    label: "Photo public",
    get: (m) => (m.photo_public ? "yes" : "no"),
  },
  qr_issued_at: {
    label: "QR issued",
    get: (m) => (m.qr_issued_at ? m.qr_issued_at.slice(0, 10) : ""),
  },
  qr_emailed_at: {
    label: "QR emailed",
    get: (m) => (m.qr_emailed_at ? m.qr_emailed_at.slice(0, 10) : ""),
  },
  qr_token: { label: "QR token", get: (m) => m.qr_token ?? "" },
};

const DEFAULT_COLS: ColKey[] = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "level",
  "status",
  "member_since",
];

// RFC 4180 escaping: wrap fields containing commas, quotes, or newlines
// in double quotes, with embedded quotes doubled.
function csvCell(v: string): string {
  if (/[",\r\n]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

function isColKey(v: string): v is ColKey {
  return v in COLUMNS;
}

export async function GET(req: NextRequest) {
  await requireStaff();
  const { searchParams } = new URL(req.url);

  const colsRaw = searchParams.get("cols") ?? "";
  const requested = colsRaw
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is ColKey => c.length > 0 && isColKey(c));
  const cols: ColKey[] = requested.length > 0 ? requested : DEFAULT_COLS;

  const q = (searchParams.get("q") ?? "").trim();
  const levelParam = searchParams.get("level") ?? "";
  const statusParam = searchParams.get("status") ?? "active";
  const level =
    levelParam && (MEMBER_LEVEL_VALUES as readonly string[]).includes(levelParam)
      ? (levelParam as MemberLevel)
      : null;
  const status =
    statusParam && (MEMBER_STATUS_VALUES as readonly string[]).includes(statusParam)
      ? (statusParam as MemberStatus)
      : "active";
  const sort = searchParams.get("sort") ?? "last_name";
  const dirParam = searchParams.get("dir") ?? "asc";
  const ascending = dirParam !== "desc";

  // Same query shape as /admin/members/page.tsx. Trust the page's
  // already-validated filters; this route is staff-gated so a
  // malformed param at worst yields a 500 — no data leak.
  const supabase = await createClient();
  let query = supabase.from("members").select("*");

  if (sort === "last_name") {
    query = query
      .order("last_name", { ascending })
      .order("first_name", { ascending });
  } else {
    query = query
      .order(sort, { ascending })
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });
  }

  if (level) query = query.eq("level", level);
  if (status) query = query.eq("status", status);
  if (q) {
    const safe = q.replace(/[,()*]/g, " ");
    query = query.or(
      [
        `first_name.ilike.*${safe}*`,
        `last_name.ilike.*${safe}*`,
        `nickname.ilike.*${safe}*`,
        `email.ilike.*${safe}*`,
        `phone.ilike.*${safe}*`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  if (error) {
    return new Response(`Export failed: ${error.message}`, { status: 500 });
  }
  const rows = (data ?? []) as MemberRow[];

  // Build CSV with CRLF line endings for Excel compatibility.
  const header = cols.map((c) => csvCell(COLUMNS[c].label)).join(",");
  const body = rows
    .map((r) => cols.map((c) => csvCell(COLUMNS[c].get(r))).join(","))
    .join("\r\n");
  const csv = body ? `${header}\r\n${body}\r\n` : `${header}\r\n`;

  const today = new Date().toISOString().slice(0, 10);
  const filename = `members-${today}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
