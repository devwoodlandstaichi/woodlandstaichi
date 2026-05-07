import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpTrigger } from "@/components/admin/help/help-trigger";
import type { HelpTopic } from "@/components/admin/help/registry";

// Lightweight shadcn-style primitives scoped to admin + auth pages.
// Keeps the public site's bespoke layout untouched.

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2",
        "text-base shadow-sm transition-colors",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2",
        "text-base shadow-sm transition-colors",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2",
        "text-base shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

type ButtonVariant = "default" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const buttonVariants: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground shadow hover:bg-primary/90 active:bg-primary",
  outline:
    "border border-input bg-background hover:bg-accent/10 hover:border-accent",
  ghost: "hover:bg-foreground/5 text-foreground",
  destructive:
    "bg-destructive text-primary-foreground hover:bg-destructive/90",
};

const buttonSizes: Record<ButtonSize, string> = {
  default: "h-12 px-5 text-base",
  sm: "h-10 px-3 text-sm",
  lg: "h-14 px-7 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "default", size = "default", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide",
          "transition-colors disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          buttonVariants[variant],
          buttonSizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-sm font-medium tracking-wide text-foreground/85",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  htmlFor,
  hint,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  back,
  helpTopic,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Optional back-link rendered to the left of the title with a thin
   *  vertical divider. Pass either a string href or `{ href, label }`
   *  when you want a screen-reader / tooltip label other than "Back". */
  back?: string | { href: string; label?: string };
  /** When set, renders a "Help" button in the action row that opens
   *  the help drawer for the given topic. */
  helpTopic?: HelpTopic;
}) {
  // Fixed-height strip that bottom-aligns with the sidebar's brand
  // strip across columns. Lives in flow as the first child of <main>'s
  // flex column — the surrounding layout pins it at the top by giving
  // the scrollable middle region overflow:auto, not by making this
  // sticky. `shrink-0` ensures the strip never collapses when the
  // middle content grows.
  const backHref = typeof back === "string" ? back : back?.href;
  const backLabel =
    (typeof back === "object" && back?.label) || "Back to previous page";
  return (
    <header className="-mx-4 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-foreground/10 bg-background px-4 md:-mx-6 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {backHref && (
          <>
            <Link
              href={backHref}
              aria-label={backLabel}
              className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft size={18} aria-hidden />
            </Link>
            <span aria-hidden className="h-8 w-px shrink-0 bg-foreground/15" />
          </>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-medium leading-tight tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="truncate text-xs leading-snug text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {(action || helpTopic) && (
        <div className="flex shrink-0 items-center gap-2">
          {helpTopic && <HelpTrigger topic={helpTopic} />}
          {action}
        </div>
      )}
    </header>
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-foreground/10 bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "vermillion" | "cobalt" | "jade" | "muted";
}) {
  const tones: Record<typeof tone, string> = {
    neutral: "bg-foreground/10 text-foreground",
    vermillion:
      "bg-[color-mix(in_oklch,var(--vermillion-500)_18%,transparent)] text-vermillion",
    cobalt:
      "bg-[color-mix(in_oklch,var(--cobalt-500)_18%,transparent)] text-cobalt",
    jade: "bg-[color-mix(in_oklch,var(--jade-500)_22%,transparent)] text-jade",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
