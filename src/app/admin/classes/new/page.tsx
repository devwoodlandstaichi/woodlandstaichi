import { PageHeader } from "@/components/admin/ui";
import { ClassForm } from "../class-form";
import { createClass } from "../actions";

export const metadata = { title: "New class" };

export default function NewClassPage() {
  return (
    <>
      <PageHeader
        title="New class"
        description="Add a recurring class to the schedule."
        back="/admin/classes"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <div className="max-w-2xl">
          <ClassForm
            action={createClass}
            submitLabel="Create class"
            cancelHref="/admin/classes"
          />
        </div>
      </div>
    </>
  );
}
