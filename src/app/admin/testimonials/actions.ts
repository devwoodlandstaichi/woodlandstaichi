"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";

type FieldErrors = Record<string, string>;

export type TestimonialFormValues = {
  member_name: string;
  attribution: string;
  quote: string;
  display_order: string;
  active: boolean;
};

export type TestimonialFormState =
  | {
      ok: false;
      message?: string;
      errors?: FieldErrors;
      values?: TestimonialFormValues;
    }
  | { ok: true }
  | undefined;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function valuesFrom(formData: FormData): TestimonialFormValues {
  return {
    member_name: str(formData, "member_name"),
    attribution: str(formData, "attribution"),
    quote: str(formData, "quote"),
    display_order: str(formData, "display_order"),
    active: formData.get("active") === "on",
  };
}

type TestimonialPatch = {
  member_name: string;
  attribution: string | null;
  quote: string;
  display_order: number;
  active: boolean;
};

function parse(
  formData: FormData,
): { data: TestimonialPatch } | { errors: FieldErrors } {
  const errors: FieldErrors = {};
  const v = valuesFrom(formData);

  if (v.member_name.length < 1) errors.member_name = "Name is required.";
  if (v.quote.length < 5) errors.quote = "Quote is required.";

  let display_order = 0;
  if (v.display_order) {
    const n = Number(v.display_order);
    if (!Number.isInteger(n) || n < 0 || n > 9999)
      errors.display_order = "Whole number 0–9999.";
    else display_order = n;
  }

  if (Object.keys(errors).length) return { errors };

  return {
    data: {
      member_name: v.member_name,
      attribution: v.attribution || null,
      quote: v.quote,
      display_order,
      active: v.active,
    },
  };
}

export async function createTestimonial(
  _prev: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").insert(parsed.data);
  if (error) {
    return { ok: false, message: error.message, values: valuesFrom(formData) };
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/about");
  redirect("/admin/testimonials");
}

export async function updateTestimonial(
  id: string,
  _prev: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("testimonials")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return { ok: false, message: error.message, values: valuesFrom(formData) };
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/about");
  redirect("/admin/testimonials");
}

async function setActive(id: string, active: boolean) {
  await requireStaff();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("testimonials").update({ active }).eq("id", id);
  revalidatePath("/admin/testimonials");
  revalidatePath("/about");
}

export async function activateTestimonial(formData: FormData) {
  return setActive(String(formData.get("id") ?? ""), true);
}
export async function deactivateTestimonial(formData: FormData) {
  return setActive(String(formData.get("id") ?? ""), false);
}

export async function deleteTestimonial(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("testimonials").delete().eq("id", id);
  revalidatePath("/admin/testimonials");
  revalidatePath("/about");
}

// ---------------------------------------------------------------------------
// Approval queue (Phase 5.1). Members can submit testimonials with
// status='pending'. Approval flips status='approved' AND active=true, so
// the row immediately appears on /about. Rejection records an optional
// reviewer note that the member sees on their /members/me submissions list.
// ---------------------------------------------------------------------------

export async function approveTestimonial(formData: FormData) {
  const reviewer = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("testimonials")
    .update({
      status: "approved",
      active: true,
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: reviewer.id,
      reviewer_note: null,
    })
    .eq("id", id);
  revalidatePath("/admin/testimonials");
  revalidatePath("/admin");
  revalidatePath("/about");
  revalidatePath("/members/me");
}

export async function rejectTestimonial(formData: FormData) {
  const reviewer = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const note = String(formData.get("reviewer_note") ?? "").trim() || null;
  const supabase = await createClient();
  await supabase
    .from("testimonials")
    .update({
      status: "rejected",
      active: false,
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: reviewer.id,
      reviewer_note: note,
    })
    .eq("id", id);
  revalidatePath("/admin/testimonials");
  revalidatePath("/admin");
  revalidatePath("/about");
  revalidatePath("/members/me");
}
