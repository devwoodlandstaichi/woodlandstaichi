import { PageHeader } from "@/components/admin/ui";
import { InstructorForm } from "../instructor-form";
import { createInstructor } from "../actions";

export const metadata = { title: "New instructor" };

export default function NewInstructorPage() {
  return (
    <>
      <PageHeader
        title="New instructor"
        description="Add a volunteer instructor. They'll appear on the public Instructors page when active."
      />
      <InstructorForm
        action={createInstructor}
        submitLabel="Create instructor"
        cancelHref="/admin/instructors"
      />
    </>
  );
}
