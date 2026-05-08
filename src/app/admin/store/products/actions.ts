"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/dal";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const PHOTO_BUCKET = "store-products";
const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const CATEGORIES = [
  "shirt",
  "jacket-ladies",
  "jacket-mens",
  "fan",
  "uniform",
  "patch",
  "shoes",
] as const;
type Category = (typeof CATEGORIES)[number];

type FieldErrors = Record<string, string>;

export type ProductFormValues = {
  slug: string;
  name: string;
  tagline: string;
  body: string;
  note: string;
  category: string;
  price_range_label: string;
  discount_label: string;
  discount_url: string;
  display_order: string;
  active: boolean;
};

export type ProductFormState =
  | {
      ok: false;
      message?: string;
      errors?: FieldErrors;
      values?: ProductFormValues;
    }
  | { ok: true }
  | undefined;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function valuesFrom(formData: FormData): ProductFormValues {
  return {
    slug: str(formData, "slug"),
    name: str(formData, "name"),
    tagline: str(formData, "tagline"),
    body: str(formData, "body"),
    note: str(formData, "note"),
    category: str(formData, "category"),
    price_range_label: str(formData, "price_range_label"),
    discount_label: str(formData, "discount_label"),
    discount_url: str(formData, "discount_url"),
    display_order: str(formData, "display_order"),
    active: formData.get("active") === "on",
  };
}

type ProductPatch = {
  slug: string;
  name: string;
  tagline: string | null;
  body: string | null;
  note: string | null;
  category: Category;
  price_range_label: string | null;
  discount_label: string | null;
  discount_url: string | null;
  display_order: number;
  active: boolean;
};

function parse(
  formData: FormData,
): { data: ProductPatch } | { errors: FieldErrors } {
  const errors: FieldErrors = {};
  const v = valuesFrom(formData);

  if (!v.slug) errors.slug = "Required.";
  else if (!SLUG_RE.test(v.slug))
    errors.slug = "Lower-case letters, digits, hyphens only.";

  if (!v.name) errors.name = "Required.";

  if (!(CATEGORIES as readonly string[]).includes(v.category))
    errors.category = "Pick a category.";

  let order = 0;
  if (v.display_order) {
    const n = Number(v.display_order);
    if (!Number.isInteger(n) || n < 0 || n > 9999)
      errors.display_order = "Whole number 0 – 9999.";
    else order = n;
  }

  if (Object.keys(errors).length) return { errors };

  return {
    data: {
      slug: v.slug,
      name: v.name,
      tagline: v.tagline || null,
      body: v.body || null,
      note: v.note || null,
      category: v.category as Category,
      price_range_label: v.price_range_label || null,
      discount_label: v.discount_label || null,
      discount_url: v.discount_url || null,
      display_order: order,
      active: v.active,
    },
  };
}

// ---------------------------------------------------------------------------
// Photo handling — same shape as news cover image. Service-role
// client bypasses storage RLS; the action itself is gated by
// requireStaff().
// ---------------------------------------------------------------------------

type PhotoChange =
  | { kind: "keep" }
  | { kind: "set"; url: string; path: string }
  | { kind: "clear" }
  | { kind: "error"; message: string };

async function resolvePhotoChange(
  formData: FormData,
  existingPath: string | null,
): Promise<PhotoChange> {
  const remove = formData.get("remove_image") === "1";
  const file = formData.get("image");

  if (remove) {
    if (existingPath) {
      const admin = createAdminClient();
      await admin.storage.from(PHOTO_BUCKET).remove([existingPath]);
    }
    return { kind: "clear" };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { kind: "keep" };
  }

  const ext = PHOTO_EXTENSIONS[file.type];
  if (!ext) {
    return {
      kind: "error",
      message: "Product photo must be JPEG, PNG, or WebP.",
    };
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return { kind: "error", message: "Product photo must be under 5 MB." };
  }

  const path = `${crypto.randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadErr) {
    return { kind: "error", message: uploadErr.message };
  }

  if (existingPath) {
    await admin.storage.from(PHOTO_BUCKET).remove([existingPath]);
  }

  const { data: urlData } = admin.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(path);
  return { kind: "set", url: urlData.publicUrl, path };
}

function applyPhotoToPatch<T extends Record<string, unknown>>(
  patch: T,
  change: PhotoChange,
): T {
  if (change.kind === "set") {
    return { ...patch, image_url: change.url, image_path: change.path };
  }
  if (change.kind === "clear") {
    return { ...patch, image_url: null, image_path: null };
  }
  return patch;
}

// ---------------------------------------------------------------------------
// Create / update / delete product
// ---------------------------------------------------------------------------

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();

  // Slug uniqueness check up front so we get a friendly message
  // instead of a Postgres unique-constraint error.
  const { data: existing } = await supabase
    .from("store_products")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      errors: { slug: "Already used by another product." },
      values: valuesFrom(formData),
    };
  }

  const photo = await resolvePhotoChange(formData, null);
  if (photo.kind === "error") {
    return {
      ok: false,
      message: photo.message,
      values: valuesFrom(formData),
    };
  }

  const insertPatch = applyPhotoToPatch(parsed.data, photo);
  const { data: row, error } = await supabase
    .from("store_products")
    .insert(insertPatch)
    .select("id")
    .single();
  if (error || !row) {
    return {
      ok: false,
      message: error?.message ?? "Could not create product.",
      values: valuesFrom(formData),
    };
  }

  revalidatePath("/admin/store/products");
  redirect(`/admin/store/products/${row.id}/edit`);
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("store_products")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  const existingPath = (current?.image_path as string | null) ?? null;

  // Reject slug collision with any OTHER row.
  const { data: collision } = await supabase
    .from("store_products")
    .select("id")
    .eq("slug", parsed.data.slug)
    .neq("id", id)
    .maybeSingle();
  if (collision) {
    return {
      ok: false,
      errors: { slug: "Already used by another product." },
      values: valuesFrom(formData),
    };
  }

  const photo = await resolvePhotoChange(formData, existingPath);
  if (photo.kind === "error") {
    return {
      ok: false,
      message: photo.message,
      values: valuesFrom(formData),
    };
  }

  const updatePatch = applyPhotoToPatch(parsed.data, photo);
  const { error } = await supabase
    .from("store_products")
    .update(updatePatch)
    .eq("id", id);
  if (error) {
    return {
      ok: false,
      message: error.message,
      values: valuesFrom(formData),
    };
  }

  revalidatePath("/admin/store/products");
  revalidatePath(`/admin/store/products/${id}/edit`);
  redirect(`/admin/store/products/${id}/edit`);
}

export async function deleteProduct(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  // Pull the photo path so we can clean up Storage after the row is
  // gone. ON DELETE CASCADE handles variants.
  const { data: row } = await supabase
    .from("store_products")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("store_products").delete().eq("id", id);

  if (row?.image_path) {
    const admin = createAdminClient();
    await admin.storage
      .from(PHOTO_BUCKET)
      .remove([row.image_path as string]);
  }

  revalidatePath("/admin/store/products");
  redirect("/admin/store/products");
}

// ---------------------------------------------------------------------------
// Variants — a product's per-SKU rows. Saved as a single batch from
// the inline editor on the edit page so the founder doesn't have to
// click Save on every row.
// ---------------------------------------------------------------------------

type VariantInput = {
  id: string | null;
  sku: string;
  size: string;
  price_dollars: string;
  length_inches: string;
  width_inches: string;
  display_order: string;
  active: boolean;
  delete: boolean;
};

export type VariantSaveState =
  | { ok: false; message: string }
  | { ok: true; saved: number; deleted: number }
  | undefined;

function readVariantBatch(formData: FormData): VariantInput[] {
  // Form fields use names like variants[0][sku], variants[0][price_dollars].
  // Group them by index.
  const byIndex: Record<string, VariantInput> = {};
  for (const [key, raw] of formData.entries()) {
    const m = /^variants\[(\d+)\]\[(\w+)\]$/.exec(key);
    if (!m || typeof raw !== "string") continue;
    const idx = m[1];
    const field = m[2];
    if (!byIndex[idx]) {
      byIndex[idx] = {
        id: null,
        sku: "",
        size: "",
        price_dollars: "",
        length_inches: "",
        width_inches: "",
        display_order: "",
        active: true,
        delete: false,
      };
    }
    const target = byIndex[idx];
    if (field === "active") target.active = raw === "on" || raw === "true";
    else if (field === "delete") target.delete = raw === "1";
    else if (field in target) {
      // Narrow to the string-valued keys.
      (target as unknown as Record<string, string>)[field] = raw;
    }
  }
  return Object.values(byIndex);
}

export async function saveVariants(
  productId: string,
  _prev: VariantSaveState,
  formData: FormData,
): Promise<VariantSaveState> {
  await requireStaff();
  const supabase = await createClient();

  const batch = readVariantBatch(formData);

  let saved = 0;
  let deleted = 0;

  for (const v of batch) {
    if (v.delete && v.id) {
      const { error } = await supabase
        .from("store_variants")
        .delete()
        .eq("id", v.id);
      if (error) return { ok: false, message: error.message };
      deleted++;
      continue;
    }

    if (!v.sku) continue; // skip blank rows the user added but didn't fill

    const dollars = Number(v.price_dollars);
    if (!Number.isFinite(dollars) || dollars < 0) {
      return {
        ok: false,
        message: `Variant ${v.sku || "(blank SKU)"}: price must be a non-negative number.`,
      };
    }
    const price_cents = Math.round(dollars * 100);

    const length =
      v.length_inches.trim() === "" ? null : Number(v.length_inches);
    const width =
      v.width_inches.trim() === "" ? null : Number(v.width_inches);
    if (length !== null && !Number.isFinite(length)) {
      return {
        ok: false,
        message: `Variant ${v.sku}: length must be a number or blank.`,
      };
    }
    if (width !== null && !Number.isFinite(width)) {
      return {
        ok: false,
        message: `Variant ${v.sku}: width must be a number or blank.`,
      };
    }
    const display_order = v.display_order.trim() === "" ? 0 : Number(v.display_order);

    const patch = {
      product_id: productId,
      sku: v.sku.trim(),
      size: v.size.trim() || null,
      price_cents,
      length_inches: length,
      width_inches: width,
      display_order: Number.isInteger(display_order) ? display_order : 0,
      active: v.active,
    };

    if (v.id) {
      const { error } = await supabase
        .from("store_variants")
        .update(patch)
        .eq("id", v.id);
      if (error) return { ok: false, message: error.message };
      saved++;
    } else {
      const { error } = await supabase.from("store_variants").insert(patch);
      if (error) return { ok: false, message: error.message };
      saved++;
    }
  }

  revalidatePath(`/admin/store/products/${productId}/edit`);
  revalidatePath("/admin/store/products");
  return { ok: true, saved, deleted };
}
