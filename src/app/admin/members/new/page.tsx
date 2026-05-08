import { PageHeader } from "@/components/admin/ui";
import { MemberForm } from "../member-form";
import { createMember } from "../actions";

export const metadata = { title: "Add member" };
export const dynamic = "force-dynamic";

// Admin-create surface, separate from the public /classes/register
// flow. Bypasses payment / shirt / waiver capture — used when staff
// enter a member from a paper form, by phone, or transferring
// historical roster data. Defaults to status=waitlist so admin still
// has to consciously promote them to active once payment lands.

export default function NewMemberPage() {
  return (
    <>
      <PageHeader
        title="Add member"
        description="Type in their details directly. For self-service registration with payment, use the public form at /classes/register."
        back="/admin/members"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <MemberForm
          action={createMember}
          defaults={{ level: "beginners", status: "waitlist" }}
          submitLabel="Create member"
          cancelHref="/admin/members"
        />
      </div>
    </>
  );
}
