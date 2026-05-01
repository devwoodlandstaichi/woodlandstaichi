// Types and constants shared between the server page (page.tsx) and the
// client table (members-table.tsx). Kept in a directive-less file so the
// `"use client"` boundary in members-table.tsx doesn't wrap these as
// client references — without that, importing SORT_COLUMNS into the
// server page would yield a reference object whose .reduce is undefined.

import type { MemberLevel, MemberStatus } from "@/lib/format";

export type MemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  level: MemberLevel;
  status: MemberStatus;
  qr_token: string | null;
};

export const SORT_COLUMNS = [
  "last_name",
  "email",
  "phone",
  "level",
  "status",
] as const;

export type SortColumn = (typeof SORT_COLUMNS)[number];
export type SortDir = "asc" | "desc";
