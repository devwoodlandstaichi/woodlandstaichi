"use client";

import Image from "next/image";
import { useActionState, useId, useState } from "react";
import { Eye, EyeOff, ImageOff, Upload } from "lucide-react";
import { Button } from "@/components/admin/ui";
import { CraneMark } from "@/components/crane-mark";
import { type PhotoState, type PhotoVisibilityState } from "./actions";

// Reusable photo upload + remove + public-visibility toggle. Caller
// passes the two bound actions so the same UI works for admin
// (setMemberPhoto + setMemberPhotoPublic, both bound to a member id)
// and member self-serve (setOwnMemberPhoto + setOwnPhotoPublic). The
// upload form lives separately from the broader profile form so the
// multipart upload doesn't tangle with the React 19 re-key pattern.

export function PhotoForm({
  action,
  visibilityAction,
  memberName,
  photoUrl,
  photoPublic,
  description,
}: {
  action: (
    state: PhotoState,
    formData: FormData,
  ) => Promise<PhotoState>;
  visibilityAction?: (
    state: PhotoVisibilityState,
    formData: FormData,
  ) => Promise<PhotoVisibilityState>;
  memberName: string;
  photoUrl: string | null;
  photoPublic?: boolean;
  description?: string;
}) {
  const [state, formAction, pending] = useActionState<PhotoState, FormData>(
    action,
    undefined,
  );
  const reactId = useId();
  const inputId = `photo-${reactId}`;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) {
      setPreviewUrl(URL.createObjectURL(f));
      setFileName(f.name);
    } else {
      setPreviewUrl(null);
      setFileName(null);
    }
  }

  return (
    <section className="rounded-xl border border-foreground/10 bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start gap-5">
        {/* Current / preview portrait */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-foreground/10 bg-vermillion/8">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Selected photo preview"
              className="h-full w-full object-cover"
            />
          ) : photoUrl ? (
            <Image
              src={photoUrl}
              alt={memberName}
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            // Brand-forward placeholder when no photo is on file. The
            // crane crest fills the avatar circle in vermillion.
            <CraneMark
              className="h-full w-full p-3 text-vermillion/70"
              ariaLabel={`No photo for ${memberName}`}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-medium tracking-tight">
            Photo
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {description ??
              "JPEG, PNG, WebP, or HEIC (under 12 MB). Auto-cropped to a 3:4 portrait, resized to 900×1200, EXIF stripped on upload."}
          </p>

          {state?.ok === false && (
            <p
              role="alert"
              className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {state.message}
            </p>
          )}
          {state?.ok === true && (
            <p
              role="status"
              className="mt-3 rounded-md border border-jade/30 bg-[color-mix(in_oklch,var(--jade-500)_10%,transparent)] px-3 py-2 text-sm"
            >
              Photo saved.
            </p>
          )}

          <form
            action={formAction}
            className="mt-4 flex flex-wrap items-center gap-3"
          >
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif"
              onChange={onFileChange}
              className="hidden"
              id={inputId}
            />
            <label
              htmlFor={inputId}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10 hover:border-accent"
            >
              <Upload size={14} aria-hidden />
              {fileName ? "Pick a different photo" : "Choose photo"}
            </label>
            {fileName && (
              <p className="truncate text-xs text-muted-foreground max-w-[12rem]">
                {fileName}
              </p>
            )}

            <Button
              type="submit"
              disabled={pending || !fileName}
              className="ml-auto"
            >
              {pending ? "Uploading…" : "Upload"}
            </Button>
          </form>

          {photoUrl && !fileName && (
            <form action={formAction} className="mt-3">
              <input type="hidden" name="remove_photo" value="1" />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                disabled={pending}
                className="text-destructive hover:bg-destructive/10"
              >
                <ImageOff size={14} aria-hidden /> Remove photo
              </Button>
            </form>
          )}

          {visibilityAction && photoUrl && (
            <VisibilityToggle
              action={visibilityAction}
              initial={!!photoPublic}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function VisibilityToggle({
  action,
  initial,
}: {
  action: (
    state: PhotoVisibilityState,
    formData: FormData,
  ) => Promise<PhotoVisibilityState>;
  initial: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    PhotoVisibilityState,
    FormData
  >(action, undefined);
  // Optimistic mirror — the checkbox tracks the user's intent
  // immediately, then reconciles with the action result.
  const [checked, setChecked] = useState(initial);
  // Keep in sync if the server bounces the value (e.g. error → revert).
  const [lastResolved, setLastResolved] = useState<boolean | null>(null);
  if (
    state &&
    state.ok === true &&
    state.photo_public !== lastResolved
  ) {
    setLastResolved(state.photo_public);
    if (state.photo_public !== checked) setChecked(state.photo_public);
  }

  function onToggle(next: boolean) {
    setChecked(next);
    const fd = new FormData();
    fd.set("photo_public", next ? "1" : "0");
    formAction(fd);
  }

  return (
    <div className="mt-4 flex items-start gap-3 rounded-md border border-foreground/10 bg-secondary/40 px-3 py-3">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground"
      >
        {checked ? <Eye size={14} /> : <EyeOff size={14} />}
      </span>
      <label className="flex flex-1 cursor-pointer flex-col gap-1 text-sm">
        <span className="font-medium">Show this photo publicly</span>
        <span className="text-xs text-muted-foreground leading-relaxed">
          When on, the photo may appear on public pages (instructor cards,
          future practitioner roster). When off, only you and the school
          staff can see it. Default is off.
        </span>
      </label>
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label="Show this photo publicly"
        className="mt-1 h-5 w-5 cursor-pointer rounded border border-input"
      />
      {state && state.ok === false && (
        <p
          role="alert"
          className="basis-full text-xs text-destructive"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
