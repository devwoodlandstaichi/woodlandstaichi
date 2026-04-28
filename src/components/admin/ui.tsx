import * as React from "react";
import { cn } from "@/lib/utils";

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
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  // Sticky strip is fixed-height so it bottom-aligns with the sidebar's
  // brand strip across columns. The `mb-4` gives every page a uniform
  // breathing gap below the header. On pages with a sticky filter bar at
  // `top-16`, the filter pins flush with the header's bottom border once
  // the user scrolls past 16px, so the gap exists only at the top of the
  // page. Body gradient briefly peeking through the gap during scroll is
  // intentional and visually subtle.
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 flex h-16 items-center justify-between gap-3 border-b border-foreground/10 bg-background px-4 md:-mx-6 md:px-6">
      <div className="min-w-0">
        <h1 className="truncate font-display text-xl font-medium leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="truncate text-xs leading-snug text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 gap-2">{action}</div>
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
