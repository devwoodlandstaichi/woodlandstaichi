"use client";

import { useEffect, useState } from "react";

/** Live clock for the kiosk header — updates every 30s. Members can
 * tell at a glance whether they're on time. Server-rendered initial
 * value matches the client tick to keep hydration quiet. */
export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(i);
  }, []);

  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const day = now.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="text-right">
      <p
        className="font-display text-3xl font-medium tracking-tight tabular-nums leading-none"
        suppressHydrationWarning
      >
        {time}
      </p>
      <p
        className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground"
        suppressHydrationWarning
      >
        {day}
      </p>
    </div>
  );
}
