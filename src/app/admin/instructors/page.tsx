import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import {
  activateInstructor,
  deactivateInstructor,
  deleteInstructor,
} from "./actions";

export const metadata = { title: "Instructors" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  tier: "founder" | "senior" | "instructor" | "assistant";
  title: string | null;
  bio: string | null;
  display_order: number;
  active: boolean;
  photo_url: string | null;
};

const TIER_TONE: Record<Row["tier"], "vermillion" | "cobalt" | "jade" | "muted"> = {
  founder: "vermillion",
  senior: "cobalt",
  instructor: "jade",
  assistant: "muted",
};

const TIER_LABEL: Record<Row["tier"], string> = {
  founder: "Founder",
  senior: "Senior",
  instructor: "Instructor",
  assistant: "Assistant",
};

export default async function InstructorsAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("instructors")
    .select("id,name,tier,title,bio,display_order,active,photo_url")
    .order("active", { ascending: false })
    .order("display_order", { ascending: true });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader
        title="Instructors"
        description="Volunteer instructor roster shown on the public Instructors page."
        action={
          <Link
            href="/admin/instructors/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-medium tracking-wide text-primary-foreground shadow hover:bg-primary/90"
          >
            <Plus size={16} aria-hidden /> New instructor
          </Link>
        }
      />

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No instructors yet.
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-foreground/10 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Bio</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-foreground/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.photo_url ? (
                        <Image
                          src={r.photo_url}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 text-xs text-muted-foreground"
                        >
                          {initials(r.name)}
                        </span>
                      )}
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={TIER_TONE[r.tier]}>{TIER_LABEL[r.tier]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.title ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.bio ? (
                      <span className="text-foreground/70">
                        {r.bio.length > 60
                          ? r.bio.slice(0, 60) + "…"
                          : r.bio}
                      </span>
                    ) : (
                      <span className="italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                    {r.display_order}
                  </td>
                  <td className="px-4 py-3">
                    {r.active ? (
                      <Badge tone="jade">Active</Badge>
                    ) : (
                      <Badge tone="muted">Hidden</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/instructors/${r.id}/edit`}
                        className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10 hover:border-accent"
                      >
                        <Pencil size={14} aria-hidden /> Edit
                      </Link>
                      <form
                        action={r.active ? deactivateInstructor : activateInstructor}
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          {r.active ? "Hide" : "Show"}
                        </Button>
                      </form>
                      <form action={deleteInstructor}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}
