"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/admin/ui";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import {
  deleteGalleryPhoto,
  reorderGalleryPhoto,
  updateGalleryPhoto,
} from "./actions";

type PhotoRow = {
  id: string;
  image_url: string;
  image_path: string | null;
  alt: string;
  aspect: "landscape" | "portrait";
  sort_order: number;
  active: boolean;
};

export function PhotoTile({
  photo,
  isFirst,
  isLast,
}: {
  photo: PhotoRow;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [alt, setAlt] = useState(photo.alt);
  const [aspect, setAspect] = useState<PhotoRow["aspect"]>(photo.aspect);
  const [active, setActive] = useState(photo.active);
  const del = useConfirmDialog();

  function save() {
    const fd = new FormData();
    fd.set("id", photo.id);
    fd.set("alt", alt);
    fd.set("aspect", aspect);
    if (active) fd.set("active", "on");
    startTransition(async () => {
      await updateGalleryPhoto(fd);
      setEditing(false);
    });
  }

  function reorder(dir: "up" | "down") {
    const fd = new FormData();
    fd.set("id", photo.id);
    fd.set("dir", dir);
    startTransition(async () => {
      await reorderGalleryPhoto(fd);
    });
  }

  function confirmDelete() {
    const fd = new FormData();
    fd.set("id", photo.id);
    startTransition(async () => {
      await deleteGalleryPhoto(fd);
      del.close();
    });
  }

  const legacy = !photo.image_path;

  return (
    <li className="rounded-xl border border-foreground/10 bg-card shadow-sm overflow-hidden">
      <div
        className={`relative w-full ${
          photo.aspect === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"
        } bg-foreground/5`}
      >
        <Image
          src={photo.image_url}
          alt={photo.alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
        {!photo.active && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-foreground/80 px-2 py-0.5 text-xs text-background backdrop-blur">
            <EyeOff size={12} aria-hidden /> Hidden
          </span>
        )}
        {legacy && (
          <span className="absolute right-2 top-2 rounded-full bg-cobalt/85 px-2 py-0.5 text-xs text-background backdrop-blur">
            Legacy
          </span>
        )}
      </div>

      <div className="p-3">
        {editing ? (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-foreground/75">
              Alt text
              <textarea
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-foreground/15 bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name={`aspect-${photo.id}`}
                  checked={aspect === "landscape"}
                  onChange={() => setAspect("landscape")}
                />
                Landscape
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name={`aspect-${photo.id}`}
                  checked={aspect === "portrait"}
                  onChange={() => setAspect("portrait")}
                />
                Portrait
              </label>
              <label className="ml-auto inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Visible
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={save}
                disabled={pending}
                className="bg-vermillion text-background hover:bg-vermillion/90"
              >
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAlt(photo.alt);
                  setAspect(photo.aspect);
                  setActive(photo.active);
                  setEditing(false);
                }}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="line-clamp-2 min-h-[2.4em] text-sm text-foreground/85">
              {photo.alt || (
                <span className="italic text-foreground/50">No alt text</span>
              )}
            </p>
            <div className="mt-2 flex items-center justify-between gap-1">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => reorder("up")}
                  disabled={pending || isFirst}
                  aria-label="Move up"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/65 hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowUp size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => reorder("down")}
                  disabled={pending || isLast}
                  aria-label="Move down"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/65 hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowDown size={14} aria-hidden />
                </button>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(true)}
                  disabled={pending}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={del.show}
                  disabled={pending}
                  aria-label={`Delete photo`}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} aria-hidden />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={del.open}
        onOpenChange={del.onOpenChange}
        tone="destructive"
        title="Delete this photo?"
        description={
          <p>
            The photo will disappear from <em>/gallery</em> immediately
            {legacy ? "" : " and its file will be removed from storage"}.
            This can&rsquo;t be undone.
          </p>
        }
        confirmLabel="Delete"
        pending={pending}
        onConfirm={confirmDelete}
      />
    </li>
  );
}
