"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/admin/ui";
import { updateRsvpSettings, type RsvpSettingsState } from "./actions";

const MEMBER_LEVELS = ["instructor", "advanced", "intermediate", "beginners"] as const;
const CLASS_LEVELS = [
  "instructor",
  "advanced",
  "intermediate",
  "beginners",
  "remedial",
  "play_only",
  "combined",
] as const;

const LEVEL_LABEL: Record<string, string> = {
  instructor: "Instructor",
  advanced: "Advanced",
  intermediate: "Intermediate",
  beginners: "Beginners",
  remedial: "Remedial",
  play_only: "Play only",
  combined: "Combined",
};

export function RsvpSettingsForm({
  cutoffMinutes,
  matrix,
}: {
  cutoffMinutes: number;
  matrix: Record<string, string[]>;
}) {
  const [state, action, pending] = useActionState<RsvpSettingsState, FormData>(
    updateRsvpSettings,
    undefined,
  );

  const isAllowed = (memberLevel: string, classLevel: string) =>
    matrix[memberLevel]?.includes(classLevel) ?? false;

  return (
    <form action={action} className="grid gap-8">
      <section className="rounded-2xl border border-foreground/10 bg-card p-5 md:p-6">
        <div className="mb-1 text-[11px] uppercase tracking-[0.32em] text-foreground/55">
          <span className="mr-2 inline-block h-px w-6 align-middle bg-vermillion" />
          Cutoff window
        </div>
        <h2 className="font-display text-lg font-medium tracking-tight">
          When do new requests stop?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Members can&rsquo;t request a session whose start time is closer than
          this many minutes from now. Default 240 (4 hours).
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="number"
            name="rsvp_cutoff_minutes"
            min={0}
            max={10080}
            step={15}
            defaultValue={cutoffMinutes}
            required
            className="h-10 w-32 rounded-md border border-foreground/15 bg-background px-3 text-sm tabular-nums focus-visible:border-vermillion focus-visible:outline-none"
          />
          <span className="text-sm text-muted-foreground">
            minutes ({Math.round(cutoffMinutes / 60)} hour
            {cutoffMinutes === 60 ? "" : "s"})
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-foreground/10 bg-card p-5 md:p-6">
        <div className="mb-1 text-[11px] uppercase tracking-[0.32em] text-foreground/55">
          <span className="mr-2 inline-block h-px w-6 align-middle bg-vermillion" />
          Level matrix
        </div>
        <h2 className="font-display text-lg font-medium tracking-tight">
          Who sees what?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For each member level (rows), check the class levels (columns) they
          can request. Sessions flagged{" "}
          <em>welcoming</em> bypass this matrix.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-[1] bg-card px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Member &nbsp;\&nbsp; Class
                </th>
                {CLASS_LEVELS.map((cl) => (
                  <th
                    key={cl}
                    className="px-3 py-2 text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    {LEVEL_LABEL[cl]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEMBER_LEVELS.map((ml) => (
                <tr key={ml} className="border-t border-foreground/5">
                  <th
                    scope="row"
                    className="sticky left-0 z-[1] bg-card px-3 py-3 text-left font-medium text-foreground/85"
                  >
                    {LEVEL_LABEL[ml]}
                  </th>
                  {CLASS_LEVELS.map((cl) => (
                    <td key={cl} className="px-3 py-3 text-center">
                      <label className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-foreground/15 has-[:checked]:border-vermillion has-[:checked]:bg-vermillion/10 has-[:checked]:text-vermillion">
                        <input
                          type="checkbox"
                          name={`matrix.${ml}.${cl}`}
                          defaultChecked={isAllowed(ml, cl)}
                          className="sr-only"
                        />
                        <span aria-hidden className="text-base font-medium">
                          ✓
                        </span>
                        <span className="sr-only">
                          {LEVEL_LABEL[ml]} can request {LEVEL_LABEL[cl]}
                        </span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {state && (
          <p
            role={state.ok ? "status" : "alert"}
            className={`text-sm ${state.ok ? "text-jade" : "text-vermillion"}`}
          >
            {state.message}
          </p>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5"
        >
          <Save size={14} aria-hidden /> {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
