import { getSessionUser } from "@/lib/auth/dal";
import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader() {
  const user = await getSessionUser();
  const signedIn = !!user;
  const isStaff = user?.role === "admin" || user?.role === "instructor";
  return <SiteHeaderClient signedIn={signedIn} isStaff={isStaff} />;
}
