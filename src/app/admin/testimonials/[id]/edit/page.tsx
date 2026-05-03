import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { TestimonialForm } from "../../testimonial-form";
import { updateTestimonial } from "../../actions";

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

  const action = updateTestimonial.bind(null, id);

  return (
    <>
      <PageHeader
        title="Edit testimonial"
        description={`From ${data.member_name}.`}
        back="/admin/testimonials"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <TestimonialForm
          action={action}
          defaults={data}
          submitLabel="Save changes"
          cancelHref="/admin/testimonials"
        />
      </div>
    </>
  );
}
