"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/dal";
import { todayIsoInSchoolTz } from "@/lib/format";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const COVER_BUCKET = "news";
const COVER_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const COVER_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type CoverChange =
  | { kind: "keep" }
  | { kind: "set"; url: string; path: string }
  | { kind: "clear" }
  | { kind: "error"; message: string };

// Handle the cover_image / remove_cover_image fields on the form. Uses
// the service-role admin client for storage so it bypasses storage
// RLS — the action itself already gates on requireStaff().
async function resolveCoverChange(
  formData: FormData,
  existingPath: string | null,
): Promise<CoverChange> {
  const remove = formData.get("remove_cover_image") === "1";
  const file = formData.get("cover_image");

  // Explicit removal wins over any uploaded file.
  if (remove) {
    if (existingPath) {
      const admin = createAdminClient();
      await admin.storage.from(COVER_BUCKET).remove([existingPath]);
    }
    return { kind: "clear" };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { kind: "keep" };
  }

  const ext = COVER_EXTENSIONS[file.type];
  if (!ext) {
    return {
      kind: "error",
      message: "Cover image must be JPEG, PNG, WebP, or GIF.",
    };
  }
  if (file.size > COVER_MAX_BYTES) {
    return { kind: "error", message: "Cover image must be under 5 MB." };
  }

  const path = `${crypto.randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from(COVER_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadErr) {
    return { kind: "error", message: uploadErr.message };
  }

  // Replace old cover only after the new upload succeeds.
  if (existingPath) {
    await admin.storage.from(COVER_BUCKET).remove([existingPath]);
  }

  const { data: urlData } = admin.storage
    .from(COVER_BUCKET)
    .getPublicUrl(path);
  return { kind: "set", url: urlData.publicUrl, path };
}

function applyCoverToPatch<T extends Record<string, unknown>>(
  patch: T,
  change: CoverChange,
): T {
  if (change.kind === "set") {
    return {
      ...patch,
      cover_image_url: change.url,
      cover_image_path: change.path,
    };
  }
  if (change.kind === "clear") {
    return { ...patch, cover_image_url: null, cover_image_path: null };
  }
  return patch;
}

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
    posted_at = todayIsoInSchoolTz();
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

  const cover = await resolveCoverChange(formData, null);
  if (cover.kind === "error") {
    return { ok: false, message: cover.message, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("news_posts")
    .insert(applyCoverToPatch(parsed.data, cover));
  if (error) {
    // If the post insert failed but we already uploaded a file, clean up.
    if (cover.kind === "set") {
      const admin = createAdminClient();
      await admin.storage.from(COVER_BUCKET).remove([cover.path]);
    }
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
  const { data: existing } = await supabase
    .from("news_posts")
    .select("cover_image_path")
    .eq("id", id)
    .maybeSingle();

  const cover = await resolveCoverChange(
    formData,
    (existing?.cover_image_path as string | null) ?? null,
  );
  if (cover.kind === "error") {
    return { ok: false, message: cover.message, values: valuesFrom(formData) };
  }

  const { error } = await supabase
    .from("news_posts")
    .update(applyCoverToPatch(parsed.data, cover))
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
  const { data: existing } = await supabase
    .from("news_posts")
    .select("cover_image_path")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("news_posts").delete().eq("id", id);

  if (existing?.cover_image_path) {
    const admin = createAdminClient();
    await admin.storage.from(COVER_BUCKET).remove([existing.cover_image_path]);
  }

  revalidatePath("/admin/news");
  revalidatePath("/news");
}
