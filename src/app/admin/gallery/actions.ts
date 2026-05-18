"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/dal";

const BUCKET = "gallery";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB server-side cap
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type Aspect = "landscape" | "portrait";

function readAspect(formData: FormData): Aspect {
  const raw = String(formData.get("aspect") ?? "landscape");
  return raw === "portrait" ? "portrait" : "landscape";
}

export type UploadResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

// Called once per file from the bulk uploader. Client has already
// downscaled + re-encoded to JPEG, so this just validates and inserts.
// New uploads land at sort_order = (min existing) - 10 so they appear
// at the top of the list — admins can drag them down via the reorder
// buttons if they want a different position.
export async function uploadGalleryPhoto(
  formData: FormData,
): Promise<UploadResult> {
  await requireStaff();

  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();
  const aspect = readAspect(formData);

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Missing file." };
  }
  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return {
      ok: false,
      message: "Photo must be JPEG, PNG, or WebP.",
    };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Photo must be under 5 MB." };
  }

  const path = `${crypto.randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadErr) return { ok: false, message: uploadErr.message };

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);

  const supabase = await createClient();
  const { data: lowest } = await supabase
    .from("gallery_photos")
    .select("sort_order")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  const nextSort =
    typeof lowest?.sort_order === "number" ? lowest.sort_order - 10 : 0;

  const { data: inserted, error: insertErr } = await supabase
    .from("gallery_photos")
    .insert({
      image_url: urlData.publicUrl,
      image_path: path,
      alt,
      aspect,
      sort_order: nextSort,
    })
    .select("id")
    .maybeSingle();

  if (insertErr) {
    // Roll back the upload so we don't leak orphaned bytes.
    await admin.storage.from(BUCKET).remove([path]);
    return { ok: false, message: insertErr.message };
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  return { ok: true, id: (inserted?.id as string) ?? "" };
}

export async function updateGalleryPhoto(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const alt = String(formData.get("alt") ?? "").trim();
  const aspect = readAspect(formData);
  const active = formData.get("active") === "on";

  const supabase = await createClient();
  await supabase
    .from("gallery_photos")
    .update({ alt, aspect, active })
    .eq("id", id);

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

// Swap sort_order with the neighbour in the requested direction. Two
// updates wrapped in nothing fancy — concurrent admin edits on a
// gallery this small aren't a realistic concern.
export async function reorderGalleryPhoto(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!id || (dir !== "up" && dir !== "down")) return;

  const supabase = await createClient();
  const { data: self } = await supabase
    .from("gallery_photos")
    .select("id,sort_order")
    .eq("id", id)
    .maybeSingle();
  if (!self) return;

  const ascending = dir === "down";
  const { data: neighbour } = await supabase
    .from("gallery_photos")
    .select("id,sort_order")
    .neq("id", id)
    [ascending ? "gt" : "lt"]("sort_order", self.sort_order as number)
    .order("sort_order", { ascending })
    .limit(1)
    .maybeSingle();
  if (!neighbour) return;

  await supabase
    .from("gallery_photos")
    .update({ sort_order: neighbour.sort_order as number })
    .eq("id", self.id as string);
  await supabase
    .from("gallery_photos")
    .update({ sort_order: self.sort_order as number })
    .eq("id", neighbour.id as string);

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}

export async function deleteGalleryPhoto(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("gallery_photos")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("gallery_photos").delete().eq("id", id);

  // Legacy /photos/ rows have null image_path — nothing in the bucket
  // to clean up. New uploads always have a path.
  const path = existing?.image_path as string | null | undefined;
  if (path) {
    const admin = createAdminClient();
    await admin.storage.from(BUCKET).remove([path]);
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
}
