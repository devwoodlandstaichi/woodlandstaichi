import { redirect } from "next/navigation";

type SearchParams = Promise<{ next?: string; error?: string }>;

// Password sign-in is the default at /login now. Keep this route as a
// redirect so older bookmarks still resolve to a sensible page.
export default async function LegacyPasswordRedirect({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.next) qs.set("next", params.next);
  if (params.error) qs.set("error", params.error);
  const tail = qs.toString();
  redirect(tail ? `/login?${tail}` : "/login");
}
