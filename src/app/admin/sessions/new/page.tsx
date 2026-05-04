import { PageHeader } from "@/components/admin/ui";
import { EventForm } from "./event-form";

export const metadata = { title: "New event session" };
export const dynamic = "force-dynamic";

export default function NewEventSessionPage() {
  return (
    <>
      <PageHeader
        title="New event session"
        description="One-off workshops, special-instructor visits, World Tai Chi Day, etc. Same RSVP rules as a regular session."
        back="/admin/sessions"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <div className="max-w-2xl">
          <EventForm />
        </div>
      </div>
    </>
  );
}
