"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, CameraOff, Check, AlertCircle, RotateCw } from "lucide-react";
import { Button, Card } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { recordByToken, recordByMember, searchMembers } from "../../actions";

type RecordResult = Awaited<ReturnType<typeof recordByToken>>;
type Toast =
  | { tone: "ok"; title: string; subtitle?: string; visible: boolean }
  | { tone: "warn"; title: string; subtitle?: string; visible: boolean }
  | { tone: "err"; title: string; subtitle?: string; visible: boolean };

const COOLDOWN_MS = 1500; // ignore the same QR for this long after a scan
const TOAST_HOLD_MS = 1900; // visible time
const TOAST_FADE_MS = 380; // exit animation duration

export function Scanner({ sessionId }: { sessionId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // last-token-and-when, to debounce repeated reads of the same QR
  const lastSeen = useRef<{ token: string; at: number } | null>(null);

  // toast lifecycle timers — we cancel and reschedule them for each new
  // result so a rapid succession of scans always shows the latest result
  // cleanly without piling up timers.
  const toastFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (toastFadeTimer.current) clearTimeout(toastFadeTimer.current);
    if (toastClearTimer.current) clearTimeout(toastClearTimer.current);
  }, []);

  // start/stop the underlying zxing reader
  const readerRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    if (!scanning) return;

    (async () => {
      setError(null);
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        // Prefer rear camera if available (admin usually scans from a laptop,
        // but tablets default to front; this lets the device choose sensibly).
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (!result) return;
            const token = result.getText();
            const now = Date.now();
            if (
              lastSeen.current &&
              lastSeen.current.token === token &&
              now - lastSeen.current.at < COOLDOWN_MS
            ) {
              return;
            }
            lastSeen.current = { token, at: now };
            handleToken(token);
          },
        );

        // Stash a stop function on the ref so the cleanup below can reach it.
        (readerRef as { current: unknown }).current = {
          stop: () => controls?.stop(),
        };
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not start the camera.",
        );
        setScanning(false);
      }
    })();

    return () => {
      cancelled = true;
      const r = readerRef.current as { stop?: () => void } | null;
      r?.stop?.();
      readerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  function handleToken(encoded: string) {
    void (async () => {
      try {
        const result = await recordByToken(sessionId, encoded);
        showResult(result);
      } catch {
        showToast({
          tone: "err",
          title: "Scan failed.",
          subtitle: "Try again.",
          visible: true,
        });
      }
    })();
  }

  function showResult(r: RecordResult) {
    if (r.ok) {
      showToast({
        tone: r.duplicate ? "warn" : "ok",
        title: r.duplicate
          ? `Already scanned: ${r.memberName}`
          : `Welcome, ${r.memberName}`,
        subtitle: r.method === "manual" ? "Manual entry." : undefined,
        visible: true,
      });
    } else {
      showToast({ tone: "err", title: r.message, visible: true });
    }
  }

  /** Two-phase toast lifecycle so we get smooth enter AND exit:
   *    t=0      mount with visible=true → enter animation runs
   *    t=HOLD   flip visible=false → exit animation runs
   *    t=HOLD+FADE  unmount entirely
   *  Any new toast cancels the old timers so we don't pile up. */
  function showToast(t: Toast) {
    if (toastFadeTimer.current) clearTimeout(toastFadeTimer.current);
    if (toastClearTimer.current) clearTimeout(toastClearTimer.current);
    setToast(t);
    toastFadeTimer.current = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, visible: false } : null));
    }, TOAST_HOLD_MS);
    toastClearTimer.current = setTimeout(() => {
      setToast(null);
    }, TOAST_HOLD_MS + TOAST_FADE_MS);
  }

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden">
        <div className="relative aspect-video w-full bg-foreground/95">
          {/* Live preview */}
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            muted
          />

          {/* Crosshair / framing guide. Border tone briefly shifts to
              jade on a successful scan as a subtle non-toast cue. */}
          {scanning && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div
                className={cn(
                  "aspect-square w-1/2 max-w-xs rounded-2xl border-2 transition-all duration-300 ease-out",
                  "shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]",
                  toast?.visible && toast.tone === "ok"
                    ? "border-jade shadow-[0_0_0_9999px_rgba(0,0,0,0.35),0_0_60px_rgba(74,138,106,0.6)] scale-[1.02]"
                    : toast?.visible && toast.tone === "warn"
                      ? "border-vermillion shadow-[0_0_0_9999px_rgba(0,0,0,0.35),0_0_50px_rgba(169,29,29,0.5)]"
                      : "border-vermillion/80",
                )}
              />
            </div>
          )}

          {/* Inactive state */}
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-background/85">
              <CameraOff size={32} aria-hidden />
              <p className="text-sm">
                Camera off. Click <span className="font-medium">Start scanning</span> to begin.
              </p>
            </div>
          )}

          {/* Toast overlay — two-phase animated lifecycle.
              data-state drives Tailwind's animate-in / animate-out
              classes for both enter (slide-down + fade + zoom-up)
              and exit (fade-out + zoom-down). */}
          {toast && (
            <div
              role="status"
              data-state={toast.visible ? "open" : "closed"}
              className={cn(
                "pointer-events-none absolute left-1/2 top-4 -translate-x-1/2",
                "inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium shadow-2xl backdrop-blur",
                "duration-300 ease-out",
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-3",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2 data-[state=closed]:duration-300",
                toast.tone === "ok"
                  ? "bg-jade text-background"
                  : toast.tone === "warn"
                    ? "bg-vermillion/90 text-background"
                    : "bg-foreground text-background",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  toast.tone === "ok"
                    ? "bg-background/20"
                    : toast.tone === "warn"
                      ? "bg-background/15"
                      : "bg-background/15",
                  // tiny pop on the icon when it appears
                  "data-[state=open]:animate-in data-[state=open]:zoom-in-50 duration-500",
                )}
                data-state={toast.visible ? "open" : "closed"}
              >
                {toast.tone === "ok" ? (
                  <Check size={14} strokeWidth={2.5} />
                ) : toast.tone === "warn" ? (
                  <RotateCw size={14} strokeWidth={2.5} />
                ) : (
                  <AlertCircle size={14} strokeWidth={2.5} />
                )}
              </span>
              <span className="leading-tight">{toast.title}</span>
              {toast.subtitle && (
                <span className="text-background/80 text-xs">
                  {toast.subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-foreground/10 px-5 py-4">
          <Button
            type="button"
            onClick={() => setScanning((v) => !v)}
            variant={scanning ? "outline" : "default"}
          >
            {scanning ? (
              <>
                <CameraOff size={16} aria-hidden /> Stop scanning
              </>
            ) : (
              <>
                <Camera size={16} aria-hidden /> Start scanning
              </>
            )}
          </Button>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle size={14} aria-hidden /> {error}
            </p>
          )}
        </div>
      </Card>

      <ManualSearch sessionId={sessionId} onResult={showResult} />
    </div>
  );
}

function ManualSearch({
  sessionId,
  onResult,
}: {
  sessionId: string;
  onResult: (r: RecordResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; name: string; level: string }>
  >([]);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const matches = await searchMembers(value);
        setResults(matches);
      });
    }, 200);
  }

  function pick(memberId: string) {
    startTransition(async () => {
      const r = await recordByMember(sessionId, memberId);
      onResult(r);
      setQuery("");
      setResults([]);
    });
  }

  return (
    <Card className="p-5">
      <h3 className="font-display text-lg font-medium tracking-tight">
        Can&apos;t scan?
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Type a name to find the member and mark them present manually.
      </p>
      <input
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Last name, first name, or nickname"
        className="mt-4 h-12 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
      {pending && results.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">Searching…</p>
      )}
      {results.length > 0 && (
        <ul className="mt-3 divide-y divide-foreground/5 rounded-md border border-foreground/10">
          {results.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => pick(m.id)}
                disabled={pending}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-foreground/[0.03] disabled:opacity-50"
              >
                <span className="font-medium">{m.name}</span>
                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {m.level}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
