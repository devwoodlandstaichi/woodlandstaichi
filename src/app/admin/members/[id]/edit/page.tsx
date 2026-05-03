import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { MemberForm } from "../../member-form";
import { PhotoForm } from "../../photo-form";
import {
  setMemberPhoto,
  setMemberPhotoPublic,
  updateMember,
} from "../../actions";

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
        back={`/admin/members/${id}`}
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <div className="mb-6">
          <PhotoForm
            action={setMemberPhoto.bind(null, id)}
            visibilityAction={setMemberPhotoPublic.bind(null, id)}
            memberName={`${data.first_name} ${data.last_name}`}
            photoUrl={(data.photo_url as string | null) ?? null}
            photoPublic={(data.photo_public as boolean | null) ?? false}
          />
        </div>
        <MemberForm
          action={action}
          defaults={data}
          submitLabel="Save changes"
          cancelHref={`/admin/members/${id}`}
        />
      </div>
    </>
  );
}
