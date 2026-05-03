import { PageHeader } from "@/components/admin/ui";
import { TestimonialForm } from "../testimonial-form";
import { createTestimonial } from "../actions";

export const metadata = { title: "New testimonial" };

export default function NewTestimonialPage() {
  return (
    <>
      <PageHeader
        title="New testimonial"
        description="Add a member quote. Save as inactive first if you want to preview before publishing."
        back="/admin/testimonials"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <TestimonialForm
          action={createTestimonial}
          submitLabel="Create testimonial"
          cancelHref="/admin/testimonials"
        />
      </div>
    </>
  );
}
