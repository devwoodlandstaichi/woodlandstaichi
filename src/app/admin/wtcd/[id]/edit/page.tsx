import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { EventForm } from "../../event-form";
import { updateEvent } from "../../actions";

export const metadata = { title: "Edit WTCD event" };
export const dynamic = "force-dynamic";

export default async function EditWtcdEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("wtcd_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const action = updateEvent.bind(null, id);

  return (
    <>
      <PageHeader
        title={`Edit ${data.year}`}
        description="The public page reflects changes immediately on the next render."
        back="/admin/wtcd"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <div className="mx-auto max-w-2xl">
          <EventForm
            action={action}
            defaults={{
              year: data.year,
              event_date: data.event_date,
              location: data.location,
              intro: data.intro,
              gallery_url: data.gallery_url,
              poster_url: data.poster_url,
              active: data.active,
            }}
            submitLabel="Save changes"
            cancelHref="/admin/wtcd"
          />
        </div>
      </div>
    </>
  );
}
