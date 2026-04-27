import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { MemberForm } from "../../member-form";
import { updateMember } from "../../actions";

export const metadata = { title: "Edit member" };
export const dynamic = "force-dynamic";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  // .bind() preserves the server-action metadata; arrow-closure wrappers
  // break the form-action protocol on React 19.
  const action = updateMember.bind(null, id);

  return (
    <>
      <PageHeader
        title={`Edit ${data.first_name} ${data.last_name}`}
        description="Save changes here, or use the status buttons on the detail page for quick flips."
      />
      <MemberForm
        action={action}
        defaults={data}
        submitLabel="Save changes"
        cancelHref={`/admin/members/${id}`}
      />
    </>
  );
}
