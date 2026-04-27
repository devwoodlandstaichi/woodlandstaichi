import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { TestimonialForm } from "../../testimonial-form";
import { updateTestimonial, type TestimonialFormState } from "../../actions";

export const metadata = { title: "Edit testimonial" };
export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("member_name,attribution,quote,display_order,active")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const action = (
    state: TestimonialFormState,
    formData: FormData,
  ): Promise<TestimonialFormState> => updateTestimonial(id, state, formData);

  return (
    <>
      <PageHeader
        title="Edit testimonial"
        description={`From ${data.member_name}.`}
      />
      <TestimonialForm
        action={action}
        defaults={data}
        submitLabel="Save changes"
        cancelHref="/admin/testimonials"
      />
    </>
  );
}
