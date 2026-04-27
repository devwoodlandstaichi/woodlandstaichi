"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type FieldErrors = Record<string, string>;

export type NewsFormValues = {
  title: string;
  slug: string;
  body: string;
  posted_at: string;
  display_order: string;
  published: boolean;
};

export type NewsFormState =
  | {
      ok: false;
      message?: string;
      errors?: FieldErrors;
      values?: NewsFormValues;
    }
  | { ok: true }
  | undefined;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function valuesFrom(formData: FormData): NewsFormValues {
  return {
    title: str(formData, "title"),
    slug: str(formData, "slug"),
    body: str(formData, "body"),
    posted_at: str(formData, "posted_at"),
    display_order: str(formData, "display_order"),
    published: formData.get("published") === "on",
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type Patch = {
  title: string;
  slug: string | null;
  body: string;
  posted_at: string;
  display_order: number;
  published: boolean;
};

function parse(formData: FormData): { data: Patch } | { errors: FieldErrors } {
  const errors: FieldErrors = {};
  const v = valuesFrom(formData);

  if (v.title.length < 2) errors.title = "Title is required.";
  if (v.body.length < 1) errors.body = "Body is required.";

  let slug: string | null = null;
  if (v.slug) {
    if (!SLUG_RE.test(v.slug))
      errors.slug = "Use lowercase letters, numbers, and dashes.";
    else slug = v.slug;
  } else {
    slug = slugify(v.title);
  }

  let posted_at = v.posted_at;
  if (!posted_at) {
    posted_at = new Date().toISOString().slice(0, 10);
  } else if (!DATE_RE.test(posted_at)) {
    errors.posted_at = "Use YYYY-MM-DD.";
  }

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
      title: v.title,
      slug,
      body: v.body,
      posted_at,
      display_order,
      published: v.published,
    },
  };
}

export async function createPost(
  _prev: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("news_posts").insert(parsed.data);
  if (error) {
    return { ok: false, message: error.message, values: valuesFrom(formData) };
  }

  revalidatePath("/admin/news");
  revalidatePath("/news");
  redirect("/admin/news");
}

export async function updatePost(
  id: string,
  _prev: NewsFormState,
  formData: FormData,
): Promise<NewsFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("news_posts")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return { ok: false, message: error.message, values: valuesFrom(formData) };
  }

  revalidatePath("/admin/news");
  revalidatePath("/news");
  redirect("/admin/news");
}

async function setPublished(id: string, published: boolean) {
  await requireStaff();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("news_posts").update({ published }).eq("id", id);
  revalidatePath("/admin/news");
  revalidatePath("/news");
}

export async function publishPost(formData: FormData) {
  return setPublished(String(formData.get("id") ?? ""), true);
}
export async function unpublishPost(formData: FormData) {
  return setPublished(String(formData.get("id") ?? ""), false);
}

export async function deletePost(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("news_posts").delete().eq("id", id);
  revalidatePath("/admin/news");
  revalidatePath("/news");
}
