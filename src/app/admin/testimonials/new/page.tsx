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
      />
      <TestimonialForm
        action={createTestimonial}
        submitLabel="Create testimonial"
        cancelHref="/admin/testimonials"
      />
    </>
  );
}
