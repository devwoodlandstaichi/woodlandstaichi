"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/admin/ui";
import { uploadGalleryPhoto } from "./actions";

// Max edge in pixels after client-side downscale. 2400 looks crisp on a
// 4K monitor at full-screen lightbox without bloating bucket size.
const MAX_EDGE = 2400;
const JPEG_QUALITY = 0.82;
const CONCURRENCY = 3;

type Status = "queued" | "resizing" | "uploading" | "done" | "error";
type Item = {
  id: string;
  name: string;
  status: Status;
  message?: string;
  originalBytes: number;
  finalBytes?: number;
};

async function loadBitmap(file: File): Promise<{
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  cleanup: () => void;
}> {
  // createImageBitmap handles EXIF orientation in modern browsers; if
  // unavailable, fall back to <img> which doesn't.
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return {
      width: bmp.width,
      height: bmp.height,
      draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
      cleanup: () => bmp.close(),
    };
  }
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not read image."));
    el.src = url;
  });
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    cleanup: () => URL.revokeObjectURL(url),
  };
}

async function downscaleToJpeg(file: File): Promise<{
  blob: Blob;
  aspect: "landscape" | "portrait";
}> {
  const bmp = await loadBitmap(file);
  try {
    const { width: w0, height: h0 } = bmp;
    const longest = Math.max(w0, h0);
    const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
    const w = Math.round(w0 * scale);
    const h = Math.round(h0 * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available.");
    ctx.imageSmoothingQuality = "high";
    bmp.draw(ctx, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) throw new Error("Could not re-encode photo.");

    return {
      blob,
      aspect: h > w ? "portrait" : "landscape",
    };
  } finally {
    bmp.cleanup();
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function GalleryUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [running, startTransition] = useTransition();

  function setItem(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function processOne(file: File, id: string) {
    setItem(id, { status: "resizing" });
    let blob: Blob;
    let aspect: "landscape" | "portrait";
    try {
      const out = await downscaleToJpeg(file);
      blob = out.blob;
      aspect = out.aspect;
    } catch (e) {
      setItem(id, {
        status: "error",
        message: e instanceof Error ? e.message : "Resize failed.",
      });
      return;
    }

    setItem(id, { status: "uploading", finalBytes: blob.size });

    const fd = new FormData();
    const cleanName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    fd.set("file", new File([blob], cleanName, { type: "image/jpeg" }));
    fd.set("alt", "");
    fd.set("aspect", aspect);

    const res = await uploadGalleryPhoto(fd);
    if (!res.ok) {
      setItem(id, { status: "error", message: res.message });
      return;
    }
    setItem(id, { status: "done" });
  }

  async function handleFiles(fileList: FileList) {
    const newItems: Item[] = Array.from(fileList).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      status: "queued" as const,
      originalBytes: f.size,
    }));
    setItems((prev) => [...newItems, ...prev]);

    // Pair files with their items so the worker has both.
    const queue = newItems.map((it, i) => ({ item: it, file: fileList[i] }));

    startTransition(async () => {
      // Simple windowed-concurrency loop.
      const inFlight = new Set<Promise<void>>();
      for (const { item, file } of queue) {
        const p = processOne(file, item.id).finally(() => inFlight.delete(p));
        inFlight.add(p);
        if (inFlight.size >= CONCURRENCY) {
          await Promise.race(inFlight);
        }
      }
      await Promise.all(inFlight);
      router.refresh();
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const allDone =
    items.length > 0 && items.every((i) => i.status === "done" || i.status === "error");

  return (
    <div className="rounded-xl border border-foreground/10 bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Upload
          </p>
          <p className="mt-1 font-display text-lg leading-tight">
            Add photos to the gallery
          </p>
          <p className="mt-1 text-xs text-foreground/55">
            JPEG, PNG, or WebP. Multiple files OK. Each one is resized
            to 2400px and re-encoded before upload — phone originals are
            fine.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                void handleFiles(e.target.files);
              }
            }}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={running}
            className="bg-vermillion text-background hover:bg-vermillion/90"
          >
            <Upload size={14} aria-hidden /> Choose photos
          </Button>
          {allDone && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setItems([])}
            >
              Clear list
            </Button>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <ul className="mt-4 divide-y divide-foreground/5 rounded-lg border border-foreground/10">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/75">
                {it.name}
              </span>
              <span className="tabular-nums text-xs text-muted-foreground">
                {formatBytes(it.originalBytes)}
                {it.finalBytes != null && (
                  <>
                    {" → "}
                    <span className="text-foreground/80">
                      {formatBytes(it.finalBytes)}
                    </span>
                  </>
                )}
              </span>
              <StatusBadge status={it.status} message={it.message} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status, message }: { status: Status; message?: string }) {
  if (status === "error") {
    return (
      <span
        className="text-xs font-medium text-destructive"
        title={message}
      >
        Failed{message ? `: ${message}` : ""}
      </span>
    );
  }
  const label =
    status === "queued"
      ? "Queued"
      : status === "resizing"
      ? "Resizing…"
      : status === "uploading"
      ? "Uploading…"
      : "Done";
  const tone =
    status === "done"
      ? "text-jade"
      : status === "queued"
      ? "text-muted-foreground"
      : "text-cobalt";
  return <span className={`text-xs font-medium ${tone}`}>{label}</span>;
}
