"use client";

import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type Ref,
} from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/admin/ui";

export type ExportButtonHandle = { open: () => void };

// Column definitions duplicated client-side so the dialog can show
// labels without importing the server route's COLUMNS map (which would
// drag the Supabase server client into the client bundle). Keys MUST
// stay in sync with src/app/admin/members/export/route.ts COLUMNS.

type ColKey =
  | "name_combined"
  | "first_name"
  | "last_name"
  | "nickname"
  | "email"
  | "phone"
  | "street"
  | "city"
  | "state"
  | "postal_code"
  | "birthday"
  | "sex"
  | "level"
  | "status"
  | "member_since"
  | "emergency_contact_name"
  | "emergency_contact_relationship"
  | "emergency_phone"
  | "waiver_signed_at"
  | "physical_limitations"
  | "prior_experience"
  | "found_us_via"
  | "expectations"
  | "bio"
  | "photo_url"
  | "photo_public"
  | "qr_issued_at"
  | "qr_emailed_at"
  | "qr_token";

type Group = {
  title: string;
  cols: { key: ColKey; label: string }[];
};

const GROUPS: Group[] = [
  {
    title: "Identity",
    cols: [
      { key: "name_combined", label: "Name (Last, First)" },
      { key: "first_name", label: "First name" },
      { key: "last_name", label: "Last name" },
      { key: "nickname", label: "Nickname" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
    ],
  },
  {
    title: "Address",
    cols: [
      { key: "street", label: "Street" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "postal_code", label: "ZIP" },
    ],
  },
  {
    title: "Personal",
    cols: [
      { key: "birthday", label: "Birthday" },
      { key: "sex", label: "Sex" },
      { key: "level", label: "Level" },
      { key: "status", label: "Status" },
      { key: "member_since", label: "Member since" },
    ],
  },
  {
    title: "Emergency contact",
    cols: [
      { key: "emergency_contact_name", label: "Name" },
      { key: "emergency_contact_relationship", label: "Relationship" },
      { key: "emergency_phone", label: "Phone" },
    ],
  },
  {
    title: "Onboarding",
    cols: [
      { key: "waiver_signed_at", label: "Waiver signed" },
      { key: "physical_limitations", label: "Physical limitations" },
      { key: "prior_experience", label: "Prior experience" },
      { key: "found_us_via", label: "Found us via" },
      { key: "expectations", label: "Expectations" },
    ],
  },
  {
    title: "Profile",
    cols: [
      { key: "bio", label: "Bio" },
      { key: "photo_url", label: "Photo URL" },
      { key: "photo_public", label: "Photo public" },
    ],
  },
  {
    title: "QR",
    cols: [
      { key: "qr_issued_at", label: "QR issued" },
      { key: "qr_emailed_at", label: "QR emailed" },
      { key: "qr_token", label: "QR token" },
    ],
  },
];

const DEFAULT_CHECKED: ReadonlySet<ColKey> = new Set<ColKey>([
  "first_name",
  "last_name",
  "email",
  "phone",
  "level",
  "status",
  "member_since",
]);

const ALL_COLS: ColKey[] = GROUPS.flatMap((g) => g.cols.map((c) => c.key));

export function ExportButton({
  renderTrigger,
  ref,
  selectedIds,
}: {
  renderTrigger?: (open: () => void) => React.ReactNode;
  /** When the component is mounted inside a parent dropdown, the
   *  default trigger is hidden via `renderTrigger={() => null}` and
   *  the parent drives the dialog via `ref.current.open()`. */
  ref?: Ref<ExportButtonHandle>;
  /** When provided + non-empty, the export scope flips from
   *  filter-based (q/level/status) to id-based: the route is given
   *  `?ids=...` and only those rows land in the CSV. Used when the
   *  members table has rows selected at click time. */
  selectedIds?: string[];
} = {}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<ColKey>>(
    () => new Set(DEFAULT_CHECKED),
  );

  useImperativeHandle(ref, () => ({ open: () => setOpen(true) }), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function toggle(key: ColKey) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    setChecked(new Set(ALL_COLS));
  }
  function clearAll() {
    setChecked(new Set());
  }
  function resetDefaults() {
    setChecked(new Set(DEFAULT_CHECKED));
  }

  // Compute the download URL on every render. Selected columns ride
  // in `cols`; we mirror the page's filter/sort params so the export
  // matches what the founder is currently looking at.
  const hasSelection = !!selectedIds && selectedIds.length > 0;

  const href = useMemo(() => {
    if (typeof window === "undefined") return "/admin/members/export";
    const out = new URLSearchParams();

    if (hasSelection) {
      // Selection mode: scope by id only; ignore page filters so the
      // user gets exactly what they checkboxed even if those rows
      // wouldn't pass the current filter (e.g. waitlist member
      // selected while viewing Active).
      out.set("ids", selectedIds!.join(","));
    } else {
      // Filter mode: mirror the page's query so what you see is what
      // you export.
      const pageParams = new URLSearchParams(window.location.search);
      for (const k of ["q", "level", "status", "sort", "dir"]) {
        const v = pageParams.get(k);
        if (v) out.set(k, v);
      }
    }

    // Preserve the order in GROUPS so columns export left-to-right
    // in the visual order they appear in the dialog.
    const orderedCols = ALL_COLS.filter((c) => checked.has(c));
    if (orderedCols.length > 0) out.set("cols", orderedCols.join(","));
    return `/admin/members/export?${out.toString()}`;
  }, [checked, hasSelection, selectedIds]);

  const openDialog = () => setOpen(true);

  return (
    <>
      {renderTrigger ? (
        renderTrigger(openDialog)
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openDialog}
        >
          <Download size={14} aria-hidden />
          Export CSV
        </Button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-csv-title"
          className="relative z-50"
        >
          <div
            aria-hidden
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div
                className="relative w-full transform overflow-hidden rounded-2xl border border-foreground/10 bg-card text-left shadow-2xl sm:my-8 sm:max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 pt-6 pb-2 sm:px-7 sm:pt-7">
                  <p className="mb-3 text-xs uppercase tracking-[0.45em] text-muted-foreground">
                    <span className="mr-2 inline-block h-px w-6 align-middle bg-muted-foreground/40" />
                    Export
                  </p>
                  <h2
                    id="export-csv-title"
                    className="font-display text-2xl leading-[1.15] tracking-tight"
                  >
                    Choose columns
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                    {hasSelection
                      ? `Exporting the ${selectedIds!.length} member${selectedIds!.length === 1 ? "" : "s"} you have selected.`
                      : "Exporting every member that matches the page's current filters and sort."}
                    {" "}
                    <button
                      type="button"
                      onClick={resetDefaults}
                      className="underline-offset-4 hover:underline"
                    >
                      Reset defaults
                    </button>
                    <span className="mx-2 text-foreground/30">·</span>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="underline-offset-4 hover:underline"
                    >
                      Select all
                    </button>
                    <span className="mx-2 text-foreground/30">·</span>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="underline-offset-4 hover:underline"
                    >
                      Clear
                    </button>
                  </p>
                </div>

                <div className="max-h-[60vh] overflow-y-auto px-6 py-2 sm:px-7">
                  <div className="grid gap-5 sm:grid-cols-2">
                    {GROUPS.map((g) => (
                      <fieldset
                        key={g.title}
                        className="rounded-lg border border-foreground/10 bg-secondary/30 p-4"
                      >
                        <legend className="px-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {g.title}
                        </legend>
                        <ul className="space-y-2">
                          {g.cols.map((c) => (
                            <li key={c.key}>
                              <label className="flex cursor-pointer items-start gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={checked.has(c.key)}
                                  onChange={() => toggle(c.key)}
                                  className="mt-0.5 h-4 w-4 rounded border border-input"
                                />
                                <span>{c.label}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </fieldset>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-foreground/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <p className="text-xs text-muted-foreground">
                    {checked.size === 0
                      ? "Pick at least one column."
                      : `${checked.size} column${checked.size === 1 ? "" : "s"} selected.`}
                  </p>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    {/* Plain anchor with download — the route returns
                        Content-Disposition: attachment so the browser
                        triggers a save without navigating away. */}
                    <a
                      href={href}
                      download
                      onClick={(e) => {
                        if (checked.size === 0) {
                          e.preventDefault();
                          return;
                        }
                        // Close the dialog after the click — gives the
                        // browser a tick to start the download first.
                        setTimeout(() => setOpen(false), 150);
                      }}
                      aria-disabled={checked.size === 0}
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 sm:w-auto ${
                        checked.size === 0
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    >
                      <Download size={14} aria-hidden />
                      {hasSelection
                        ? `Download ${selectedIds!.length} member${selectedIds!.length === 1 ? "" : "s"}`
                        : "Download all"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
