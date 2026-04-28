import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "admin" | "instructor";
export type AppRole = StaffRole | "member";

export type SessionUser = {
  id: string;
  email: string | null;
  role: AppRole | null;
};

// React's `cache` dedupes calls within a single render pass.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    role: (roleRow?.role as AppRole | undefined) ?? null,
  };
});

export async function requireStaff(): Promise<
  SessionUser & { role: StaffRole }
> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "instructor") {
    redirect("/login?error=unauthorized");
  }
  return user as SessionUser & { role: StaffRole };
}

export async function requireAdmin(): Promise<
  SessionUser & { role: "admin" }
> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") {
    redirect("/login?error=unauthorized");
  }
  return user as SessionUser & { role: "admin" };
}
