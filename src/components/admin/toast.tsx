"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AlertCircle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "ok" | "err" | "info";

type ToastInput = {
  title: string;
  description?: string;
  tone?: Tone;
  duration?: number;
};

type ToastItem = ToastInput & {
  id: string;
  tone: Tone;
  duration: number;
};

type Ctx = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const item: ToastItem = {
        id,
        tone: input.tone ?? "info",
        duration: input.duration ?? 5000,
        title: input.title,
        description: input.description,
      };
      setItems((prev) => [...prev, item]);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

function Toaster({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex max-h-[80vh] w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      {items.map((item) => (
        <ToastView
          key={item.id}
          item={item}
          onDismiss={() => onDismiss(item.id)}
        />
      ))}
    </div>
  );
}

function ToastView({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  // Auto-dismiss after the configured duration. Setting state in this
  // layer (not in the provider) means we only schedule one timer per
  // toast instance.
  useEffect(() => {
    const t = setTimeout(onDismiss, item.duration);
    return () => clearTimeout(t);
  }, [item.duration, onDismiss]);

  const Icon =
    item.tone === "ok" ? Check : item.tone === "err" ? AlertCircle : Info;

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto rounded-lg border bg-card text-card-foreground shadow-xl",
        "px-4 py-3 flex items-start gap-3",
        "animate-in slide-in-from-right-4 fade-in duration-200",
        item.tone === "ok" && "border-jade/40",
        item.tone === "err" && "border-destructive/40",
        item.tone === "info" && "border-foreground/15",
      )}
    >
      <Icon
        size={16}
        aria-hidden
        className={cn(
          "mt-0.5 shrink-0",
          item.tone === "ok" && "text-jade",
          item.tone === "err" && "text-destructive",
          item.tone === "info" && "text-foreground/70",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.title}</p>
        {item.description && (
          <p className="mt-1 text-xs text-muted-foreground break-words">
            {item.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
