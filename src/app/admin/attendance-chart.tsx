import { Card } from "@/components/admin/ui";
import { dayShort, formatTimeRange, levelLabel } from "@/lib/format";

export type AttendancePoint = {
  sessionId: string;
  date: string; // YYYY-MM-DD
  className: string;
  classLevel: string;
  startTime: string;
  endTime: string;
  count: number;
};

// Pure-SVG bar chart, no client JS, no chart libraries. Bars are scaled
// against the max count in the window. Phase 3 (QR scanning) is what
// will start populating these — until then, the bars sit at zero and
// the empty-state message points the founder there.

const BAR_W = 36;
const BAR_GAP = 8;
const PAD_T = 16;
const PAD_B = 76; // room for two-line x labels
const PAD_L = 32; // room for y axis numbers
const PAD_R = 12;
const PLOT_H = 200;

export function AttendanceChart({ data }: { data: AttendancePoint[] }) {
  if (data.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        No sessions in the last 30 days.
      </Card>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.count));
  // Round axis up to a friendly tick (multiples of 1, 2, 5, 10, 20…)
  const niceMax = niceCeiling(max);
  const innerW = data.length * BAR_W + (data.length - 1) * BAR_GAP;
  const W = PAD_L + innerW + PAD_R;
  const H = PAD_T + PLOT_H + PAD_B;

  // Five y-axis ticks at 0, ¼, ½, ¾, max.
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));

  const allZero = data.every((d) => d.count === 0);

  return (
    <Card className="p-5">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight">
            Attendance
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Last 30 days · {data.length} session{data.length === 1 ? "" : "s"}
          </p>
        </div>
        {allZero && (
          <p className="text-xs text-muted-foreground">
            QR scanning starts in Phase 3.
          </p>
        )}
      </header>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMinYMid meet"
          width={W}
          height={H}
          role="img"
          aria-label="Attendance per session, last 30 days"
          className="block max-w-full"
        >
          {/* Y-axis grid + labels */}
          {ticks.map((tick, i) => {
            const y = PAD_T + PLOT_H - (tick / niceMax) * PLOT_H;
            return (
              <g key={i}>
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={i === 0 ? 0.3 : 0.08}
                  strokeWidth={1}
                />
                <text
                  x={PAD_L - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="currentColor"
                  fillOpacity="0.6"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Bars + x labels */}
          {data.map((d, i) => {
            const x = PAD_L + i * (BAR_W + BAR_GAP);
            const h = (d.count / niceMax) * PLOT_H;
            const y = PAD_T + PLOT_H - h;
            const tone = barTone(d.classLevel);
            const dateLabel = shortDate(d.date);
            return (
              <g key={d.sessionId}>
                {/* Bar (min 2 px tall so zero rows still hint at the slot) */}
                <rect
                  x={x}
                  y={d.count > 0 ? y : PAD_T + PLOT_H - 2}
                  width={BAR_W}
                  height={d.count > 0 ? h : 2}
                  rx={3}
                  fill={tone.fill}
                  fillOpacity={d.count > 0 ? 1 : 0.35}
                >
                  <title>
                    {d.className} · {dayShort(dayFromIso(d.date))} {dateLabel} ·{" "}
                    {formatTimeRange(d.startTime, d.endTime)} · {d.count} present
                  </title>
                </rect>
                {/* Count label above bar (if non-zero) */}
                {d.count > 0 && (
                  <text
                    x={x + BAR_W / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={500}
                    fill="currentColor"
                  >
                    {d.count}
                  </text>
                )}
                {/* X-axis: date on top line, class abbreviation underneath */}
                <text
                  x={x + BAR_W / 2}
                  y={PAD_T + PLOT_H + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  fillOpacity="0.7"
                >
                  {dateLabel}
                </text>
                <text
                  x={x + BAR_W / 2}
                  y={PAD_T + PLOT_H + 30}
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                  fillOpacity="0.5"
                >
                  {abbrev(d.className)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {LEGEND.map((l) => (
          <span key={l.level} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: l.color }}
              aria-hidden
            />
            {levelLabel(l.level)}
          </span>
        ))}
      </div>
    </Card>
  );
}

// --- helpers ----------------------------------------------------------------

function barTone(level: string): { fill: string } {
  // Pull from CSS vars so the chart picks up the design tokens. A fallback
  // hex keeps it visible if a token is unset.
  switch (level) {
    case "beginners":
      return { fill: "var(--vermillion-500, #c0432e)" };
    case "intermediate":
      return { fill: "var(--cobalt-500, #2f5fa3)" };
    case "advanced":
    case "play_only":
      return { fill: "var(--cobalt-700, #234880)" };
    case "combined":
    case "remedial":
      return { fill: "var(--jade-500, #4f8a85)" };
    default:
      return { fill: "var(--ink-700, #4a4138)" };
  }
}

const LEGEND = [
  { level: "beginners", color: "var(--vermillion-500, #c0432e)" },
  { level: "intermediate", color: "var(--cobalt-500, #2f5fa3)" },
  { level: "advanced", color: "var(--cobalt-700, #234880)" },
  { level: "combined", color: "var(--jade-500, #4f8a85)" },
];

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayFromIso(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];
}

function abbrev(name: string): string {
  // "Wednesday Morning Beginners" → "WMB"; falls back to first 8 chars.
  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return tokens
      .slice(0, 4)
      .map((t) => t[0]?.toUpperCase() ?? "")
      .join("");
  }
  return name.slice(0, 8);
}

function niceCeiling(n: number): number {
  if (n <= 0) return 1;
  const exp = Math.floor(Math.log10(n));
  const base = Math.pow(10, exp);
  const mantissa = n / base;
  let rounded: number;
  if (mantissa <= 1) rounded = 1;
  else if (mantissa <= 2) rounded = 2;
  else if (mantissa <= 5) rounded = 5;
  else rounded = 10;
  return rounded * base;
}
