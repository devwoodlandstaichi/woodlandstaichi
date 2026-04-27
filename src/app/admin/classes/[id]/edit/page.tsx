import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { ClassForm, type ClassFormDefaults } from "../../class-form";
import { updateClass } from "../../actions";
import { DeleteClassButton } from "../../delete-class-button";

export const metadata = { title: "Edit class" };
export const dynamic = "force-dynamic";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select(
      "id,name,level,location,location_address,day_of_week,start_time,end_time,capacity,cohort_start_date,description,active,display_order",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const defaults = data as ClassFormDefaults;

  // Use .bind() so React 19 keeps the server-action metadata. An arrow-
  // function closure here breaks the form-action protocol and can render
  // a blank screen when useActionState mounts.
  const boundUpdate = updateClass.bind(null, id);

  return (
    <>
      <PageHeader
        title="Edit class"
        description={defaults.name ?? "Update this recurring class."}
      />
      <div className="max-w-2xl">
        <ClassForm
          action={boundUpdate}
          defaults={defaults}
          submitLabel="Save changes"
          cancelHref="/admin/classes"
        />

        <div className="mt-12 border-t border-destructive/20 pt-6">
          <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-destructive">
            Danger zone
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently removes this class along with its sessions,
            registrations, and attendance records. To just remove it from the
            public schedule, archive it instead.
          </p>
          <div className="mt-4">
            <DeleteClassButton
              id={id}
              name={defaults.name ?? "this class"}
              variant="outline"
            />
          </div>
        </div>
      </div>
    </>
  );
}
