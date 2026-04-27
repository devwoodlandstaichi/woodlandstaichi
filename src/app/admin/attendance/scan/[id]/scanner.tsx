"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, CameraOff, Check, AlertCircle, RotateCw } from "lucide-react";
import { Button, Card } from "@/components/admin/ui";
import { recordByToken, recordByMember, searchMembers } from "../../actions";

type RecordResult = Awaited<ReturnType<typeof recordByToken>>;
type Toast =
  | { tone: "ok"; title: string; subtitle?: string }
  | { tone: "warn"; title: string; subtitle?: string }
  | { tone: "err"; title: string; subtitle?: string };

const COOLDOWN_MS = 1500; // ignore the same QR for this long after a scan

export function Scanner({ sessionId }: { sessionId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // last-token-and-when, to debounce repeated reads of the same QR
  const lastSeen = useRef<{ token: string; at: number } | null>(null);

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
        setToast({ tone: "err", title: "Scan failed.", subtitle: "Try again." });
      }
    })();
  }

  function showResult(r: RecordResult) {
    if (r.ok) {
      setToast({
        tone: r.duplicate ? "warn" : "ok",
        title: r.duplicate ? `Already scanned: ${r.memberName}` : `Welcome, ${r.memberName}`,
        subtitle: r.method === "manual" ? "Manual entry." : undefined,
      });
    } else {
      setToast({
        tone: "err",
        title: r.message,
      });
    }
    // auto-clear after a moment
    setTimeout(() => setToast(null), 2400);
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

          {/* Crosshair / framing guide */}
          {scanning && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="aspect-square w-1/2 max-w-xs rounded-2xl border-2 border-vermillion/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
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

          {/* Toast overlay */}
          {toast && (
            <div
              role="status"
              className={`pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg ${
                toast.tone === "ok"
                  ? "bg-jade text-background"
                  : toast.tone === "warn"
                    ? "bg-vermillion/85 text-background"
                    : "bg-foreground text-background"
              }`}
            >
              {toast.tone === "ok" ? (
                <Check size={16} aria-hidden />
              ) : toast.tone === "warn" ? (
                <RotateCw size={16} aria-hidden />
              ) : (
                <AlertCircle size={16} aria-hidden />
              )}
              <span>{toast.title}</span>
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
