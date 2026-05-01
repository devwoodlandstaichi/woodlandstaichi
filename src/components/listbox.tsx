"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; sub?: string };

type ListboxProps = {
  name: string;
  label: string;
  options: readonly Option[];
  defaultValue?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  className?: string;
};

/**
 * Custom listbox / combobox dropdown.
 *
 * Why this exists: native `<select>` renders the OS picker, which on
 * iOS/Android fills half the screen and ignores the design system, and
 * on desktop uses platform fonts that clash with Fraunces+DM Sans. This
 * component matches the Tailwind UI dropdown idiom while staying
 * focused-by-trigger (aria-activedescendant pattern), so the form's
 * keyboard-only flow continues to work.
 *
 * Submission contract: writes the selected value into a hidden input
 * with the supplied `name`, so server actions get the value off the
 * FormData exactly as if it were a `<select>`.
 */
export function Listbox({
  name,
  label,
  options,
  defaultValue = "",
  required,
  hint,
  error,
  placeholder = "Choose one…",
  className,
}: ListboxProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [activeIdx, setActiveIdx] = useState(-1);

  const selected = options.find((o) => o.value === value);

  // Close when clicking outside trigger or panel.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (triggerRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // On open: highlight the currently-selected option, or first. On
  // close: clear. React 19's set-state-in-effect rule pushes us to
  // the render-time setState pattern instead of a useEffect here —
  // see CLAUDE.md gotcha catalog.
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      const i = options.findIndex((o) => o.value === value);
      setActiveIdx(i >= 0 ? i : 0);
    } else {
      setActiveIdx(-1);
    }
  }

  // Keep the active option scrolled into view as the user navigates.
  useEffect(() => {
    if (!open || activeIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `#${CSS.escape(`${id}-opt-${activeIdx}`)}`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open, id]);

  function selectAt(i: number) {
    const opt = options[i];
    if (!opt) return;
    setValue(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeIdx >= 0) selectAt(activeIdx);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      // Don't trap Tab. Just close.
      setOpen(false);
    }
  }

  const listId = `${id}-list`;
  const triggerId = `${id}-trigger`;
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={triggerId} className="text-sm font-medium">
        {label}{" "}
        {required && (
          <span aria-hidden className="text-vermillion">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-foreground/60">
          {hint}
        </p>
      )}

      {/* Hidden input carries the value into FormData. */}
      <input type="hidden" name={name} value={value} />

      <div className="relative">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            open && activeIdx >= 0 ? `${id}-opt-${activeIdx}` : undefined
          }
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={errorId ?? hintId}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onKeyDown}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-md border bg-background px-3.5 py-2.5 text-base text-left",
            "border-foreground/20 transition-colors",
            "hover:border-foreground/30",
            open && "border-vermillion",
            error && "border-vermillion bg-vermillion/5",
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1",
              !selected && "text-foreground/55",
            )}
          >
            {selected ? (
              <>
                <span className="block truncate">{selected.label}</span>
                {selected.sub && (
                  <span className="block truncate text-xs text-foreground/55 mt-0.5">
                    {selected.sub}
                  </span>
                )}
              </>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </span>
          <ChevronDown
            size={16}
            aria-hidden
            className={cn(
              "shrink-0 text-foreground/55 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={triggerId}
            className={cn(
              "absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-md border border-foreground/15 bg-background py-1 shadow-xl",
              "ring-1 ring-foreground/5",
            )}
          >
            {options.length === 0 ? (
              <li className="px-3.5 py-2.5 text-sm text-foreground/55">
                No options available.
              </li>
            ) : (
              options.map((o, i) => {
                const isSelected = o.value === value;
                const isActive = i === activeIdx;
                return (
                  <li
                    key={o.value}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseDown={(e) => {
                      // mousedown so the click doesn't lose focus to
                      // the document before the option commits.
                      e.preventDefault();
                      selectAt(i);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-base",
                      isActive && "bg-foreground/5",
                      isSelected && "text-vermillion",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{o.label}</span>
                      {o.sub && (
                        <span
                          className={cn(
                            "block truncate text-xs mt-0.5",
                            isSelected ? "text-vermillion/75" : "text-foreground/55",
                          )}
                        >
                          {o.sub}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check
                        size={16}
                        aria-hidden
                        className="shrink-0 text-vermillion"
                      />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-vermillion">
          {error}
        </p>
      )}
    </div>
  );
}
