"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  Camera,
  CameraOff,
  Check,
  CloudOff,
  RotateCw,
  SwitchCamera,
  Wifi,
} from "lucide-react";
import { Button, Card } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { recordByToken, recordByMember, searchMembers } from "../../actions";
import {
  cacheMembers,
  countQueuedScans,
  enqueueScan,
  findMemberByTokenId,
  getQueuedScans,
  removeQueuedScan,
  searchMembersLocal,
  type CachedMember,
  type QueuedScan,
} from "@/lib/scan/cache";

type RecordResult = Awaited<ReturnType<typeof recordByToken>>;
type Toast =
  | { tone: "ok"; title: string; subtitle?: string; visible: boolean }
  | { tone: "warn"; title: string; subtitle?: string; visible: boolean }
  | { tone: "err"; title: string; subtitle?: string; visible: boolean };

const COOLDOWN_MS = 1500; // ignore the same QR for this long after a scan
const TOAST_HOLD_MS = 1900; // visible time
const TOAST_FADE_MS = 380; // exit animation duration

// Synthesised beeps via Web Audio so we don't need to ship an asset.
// Three distinct tones map to the three toast tones so the room can
// hear the difference between "in", "already in", and "rejected".
type BeepTone = "ok" | "warn" | "err";
const BEEP_PROFILES: Record<BeepTone, { freq: number; dur: number; gain: number }> = {
  ok: { freq: 880, dur: 0.16, gain: 0.18 }, // bright A5 chime
  warn: { freq: 520, dur: 0.18, gain: 0.16 }, // mellower mid C5-ish
  err: { freq: 220, dur: 0.32, gain: 0.2 }, // low buzz
};

let audioCtx: AudioContext | null = null;
function playBeep(tone: BeepTone) {
  if (typeof window === "undefined") return;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const { freq, dur, gain } = BEEP_PROFILES[tone];
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = tone === "err" ? "square" : "sine";
    osc.frequency.value = freq;
    g.gain.value = 0;
    // Quick attack, exponential release — softer than a hard click.
    const t0 = audioCtx.currentTime;
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    // Silent fail — sound is a courtesy, not core functionality.
  }
}

type FacingMode = "environment" | "user";

// A network failure mid-action looks different from a 4xx/5xx server
// response — the latter we let through as a normal "failed" toast. The
// former is what we want to interpret as "we're offline, queue it."
function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    err.name === "TypeError" ||
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("offline") ||
    msg.includes("load failed")
  );
}

export function Scanner({
  sessionId,
  roster = [],
}: {
  sessionId: string;
  /** Active member roster — used to resolve QR token IDs to names
   *  while offline. The public /scan/[id] page omits it because it
   *  has no RLS-readable view of members; the offline fallback there
   *  just shows "Scan saved" without a name. */
  roster?: CachedMember[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // Connectivity / queue state surfaced via the header pill. `online`
  // tracks navigator.onLine PLUS the result of the last action call —
  // we don't trust navigator alone (iOS lies in captive portals etc.)
  // but we do trust it as a coarse signal. `queueCount` mirrors the
  // IndexedDB queue length so the pill can show "Offline · 3 queued".
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [queueCount, setQueueCount] = useState(0);
  const [draining, setDraining] = useState(false);
  // iPads default to the rear camera, but the kiosk often sits with the
  // member facing the screen; let the operator flip to the front-facing
  // ("user") camera. Browser falls back gracefully if the device only
  // exposes one.
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");

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

  // Mirror the server-rendered roster into IndexedDB on every page
  // load. Last-write-wins; we don't bother with diff/merge. Queue
  // count is read on mount + after every drain cycle.
  useEffect(() => {
    void cacheMembers(roster).catch(() => {
      /* IndexedDB unavailable (private mode etc.) — scanner still
         works online; offline paths gracefully no-op. */
    });
    void countQueuedScans().then(setQueueCount).catch(() => {});
  }, [roster]);

  // Drain the queue. Each entry is replayed via the same server
  // action that produced it; the unique (member_id, class_session_id)
  // constraint on attendance makes retries naturally idempotent.
  // Network failure during drain pauses (we'll resume on the next
  // online/visibility event); explicit server errors discard the
  // entry so the queue can't get stuck on a permanently-bad scan.
  const drainPending = useRef(false);
  async function drainQueue() {
    if (drainPending.current) return;
    drainPending.current = true;
    setDraining(true);
    try {
      const queued = await getQueuedScans();
      let synced = 0;
      let rejected = 0;
      for (const q of queued) {
        try {
          const result = q.encodedToken
            ? await recordByToken(q.sessionId, q.encodedToken)
            : q.memberId
              ? await recordByMember(q.sessionId, q.memberId)
              : null;
          if (result === null) {
            await removeQueuedScan(q.id);
            continue;
          }
          if (result.ok) {
            synced++;
            await removeQueuedScan(q.id);
          } else {
            rejected++;
            await removeQueuedScan(q.id);
          }
        } catch (err) {
          if (isNetworkError(err)) {
            // Still offline — stop draining; we'll retry on the
            // next online/visibility event.
            break;
          }
          // Auth expiry or other server-side error — surface and
          // keep the entry so a manual retry / re-auth replays it.
          rejected++;
          break;
        }
      }
      const remaining = await countQueuedScans();
      setQueueCount(remaining);
      if (synced + rejected > 0 && remaining === 0) {
        showToast({
          tone: rejected > 0 ? "warn" : "ok",
          title:
            rejected > 0
              ? `Synced ${synced}, rejected ${rejected}`
              : `Synced ${synced} pending scan${synced === 1 ? "" : "s"}`,
          visible: true,
        });
      }
      // If we reached the server at all, we're online.
      if (synced + rejected > 0) setOnline(true);
    } finally {
      drainPending.current = false;
      setDraining(false);
    }
  }

  // Connectivity hooks: drain on online, on visibilitychange, and on
  // first mount in case the page was reloaded while a queue persisted.
  useEffect(() => {
    function onOnline() {
      setOnline(true);
      void drainQueue();
    }
    function onOffline() {
      setOnline(false);
    }
    function onVisible() {
      if (document.visibilityState === "visible") {
        void drainQueue();
      }
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    void drainQueue();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function queueOfflineQrScan(encoded: string) {
    // Resolve a name from the local roster cache so the success
    // toast feels identical to the online flow. The encoded token
    // is `<tokenId>.<sig>`; we only need the prefix to look up.
    const dot = encoded.indexOf(".");
    const tokenId = dot > 0 ? encoded.slice(0, dot) : encoded;
    const cached = tokenId ? await findMemberByTokenId(tokenId) : null;

    const memberName = cached
      ? cached.nickname
        ? `${cached.first_name} (${cached.nickname})`
        : `${cached.first_name} ${cached.last_name}`
      : null;

    const queued: QueuedScan = {
      id: crypto.randomUUID(),
      sessionId,
      scannedAt: new Date().toISOString(),
      method: "qr",
      encodedToken: encoded,
      memberName: memberName ?? undefined,
    };
    await enqueueScan(queued);
    setQueueCount((n) => n + 1);
    setOnline(false);

    playBeep("ok");
    showToast({
      tone: "ok",
      title: memberName ? `Welcome, ${memberName}` : "Scan saved",
      subtitle: "Working offline — will sync when you're back online.",
      visible: true,
    });
  }

  function handleToken(encoded: string) {
    void (async () => {
      try {
        const result = await recordByToken(sessionId, encoded);
        setOnline(true);
        showResult(result);
        // Opportunistic drain: if anything was queued earlier this
        // session and we just proved the network is back, pull it.
        if (queueCount > 0) void drainQueue();
      } catch (err) {
        if (isNetworkError(err)) {
          await queueOfflineQrScan(encoded);
          return;
        }
        playBeep("err");
        showToast({
          tone: "err",
          title: "Scan failed.",
          subtitle: "Try again.",
          visible: true,
        });
      }
    })();
  }

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

        // Prefer the requested facing mode. `ideal` so a desktop with
        // only one camera still works — the constraint is treated as a
        // preference, not a hard requirement.
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: facingMode } } },
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
  }, [scanning, facingMode]);

  function showResult(r: RecordResult) {
    if (r.ok) {
      playBeep(r.duplicate ? "warn" : "ok");
      showToast({
        tone: r.duplicate ? "warn" : "ok",
        title: r.duplicate
          ? `Already scanned: ${r.memberName}`
          : `Welcome, ${r.memberName}`,
        subtitle: r.method === "manual" ? "Manual entry." : undefined,
        visible: true,
      });
    } else {
      playBeep("err");
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
      <ConnectivityBanner
        online={online}
        queueCount={queueCount}
        draining={draining}
        onSyncNow={() => void drainQueue()}
      />
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
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setFacingMode((m) => (m === "environment" ? "user" : "environment"))
            }
            title={
              facingMode === "environment"
                ? "Switch to front camera"
                : "Switch to rear camera"
            }
          >
            <SwitchCamera size={16} aria-hidden />
            {facingMode === "environment" ? "Use front camera" : "Use rear camera"}
          </Button>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle size={14} aria-hidden /> {error}
            </p>
          )}
        </div>
      </Card>

      <ManualSearch
        sessionId={sessionId}
        onResult={showResult}
        onQueued={(memberName) => {
          setQueueCount((n) => n + 1);
          setOnline(false);
          showResult({
            ok: true,
            memberId: "",
            memberName,
            method: "manual",
            duplicate: false,
          });
        }}
      />
    </div>
  );
}

function ConnectivityBanner({
  online,
  queueCount,
  draining,
  onSyncNow,
}: {
  online: boolean;
  queueCount: number;
  draining: boolean;
  onSyncNow: () => void;
}) {
  // Hide entirely when fully online with nothing queued — the calm
  // state shouldn't clutter the room.
  if (online && queueCount === 0) return null;

  const tone = online
    ? "border-jade/30 bg-[color-mix(in_oklch,var(--jade-500)_10%,transparent)]"
    : "border-vermillion/40 bg-vermillion/5";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-md border px-4 py-3 text-sm",
        tone,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          online ? "bg-jade/15 text-jade" : "bg-vermillion/15 text-vermillion",
        )}
      >
        {online ? <Wifi size={14} /> : <CloudOff size={14} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">
          {online
            ? draining
              ? `Syncing ${queueCount} pending scan${queueCount === 1 ? "" : "s"}…`
              : `${queueCount} pending scan${queueCount === 1 ? "" : "s"} ready to sync`
            : "Working offline"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {online
            ? "We'll upload them automatically — no action needed."
            : `Scans are saved locally${queueCount > 0 ? ` (${queueCount} queued)` : ""} and will upload when you're back online.`}
        </p>
      </div>
      {online && queueCount > 0 && !draining && (
        <Button type="button" size="sm" variant="outline" onClick={onSyncNow}>
          Sync now
        </Button>
      )}
    </div>
  );
}

function ManualSearch({
  sessionId,
  onResult,
  onQueued,
}: {
  sessionId: string;
  onResult: (r: RecordResult) => void;
  onQueued: (memberName: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; name: string; level: string }>
  >([]);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function searchOffline(
    value: string,
  ): Promise<Array<{ id: string; name: string; level: string }>> {
    const matches = await searchMembersLocal(value);
    return matches.map((m) => ({
      id: m.id,
      name: m.nickname
        ? `${m.last_name}, ${m.first_name} (${m.nickname})`
        : `${m.last_name}, ${m.first_name}`,
      level: m.level ?? "",
    }));
  }

  function onChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const matches = await searchMembers(value);
          setResults(matches);
        } catch (err) {
          if (isNetworkError(err)) {
            setResults(await searchOffline(value));
            return;
          }
          setResults([]);
        }
      });
    }, 200);
  }

  function pick(memberId: string, memberName: string) {
    startTransition(async () => {
      try {
        const r = await recordByMember(sessionId, memberId);
        onResult(r);
        setQuery("");
        setResults([]);
      } catch (err) {
        if (isNetworkError(err)) {
          await enqueueScan({
            id: crypto.randomUUID(),
            sessionId,
            scannedAt: new Date().toISOString(),
            method: "manual",
            memberId,
            memberName,
          });
          onQueued(memberName);
          setQuery("");
          setResults([]);
          return;
        }
        // Other errors fall through silently; manual flow has no
        // explicit error toast surface and a re-pick is cheap.
      }
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
                onClick={() => pick(m.id, m.name)}
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
