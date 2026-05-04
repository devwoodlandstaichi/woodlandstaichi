import { PageHeader } from "@/components/admin/ui";
import { EventForm } from "../event-form";
import { createEvent } from "../actions";

export const metadata = { title: "New WTCD event" };

export default function NewWtcdEventPage() {
  return (
    <>
      <PageHeader
        title="New event"
        description="Add a year. Year + event date are required; everything else is optional."
        back="/admin/wtcd"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <div className="mx-auto max-w-2xl">
          <EventForm
            action={createEvent}
            submitLabel="Create event"
            cancelHref="/admin/wtcd"
          />
        </div>
      </div>
    </>
  );
}
