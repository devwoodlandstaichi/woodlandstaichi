import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { InstructorForm } from "../../instructor-form";
import { ClearPhotoForm } from "./clear-photo-form";
import { updateInstructor } from "../../actions";

export const metadata = { title: "Edit instructor" };
export const dynamic = "force-dynamic";

export default async function EditInstructorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("instructors")
    .select("name,tier,title,bio,display_order,active,photo_url")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const action = updateInstructor.bind(null, id);

  return (
    <>
      <PageHeader title="Edit instructor" description={data.name} />
      <InstructorForm
        action={action}
        defaults={data}
        submitLabel="Save changes"
        cancelHref="/admin/instructors"
        onClearPhoto={data.photo_url ? <ClearPhotoForm id={id} /> : null}
      />
    </>
  );
}
