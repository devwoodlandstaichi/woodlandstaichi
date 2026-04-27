"use client";

import { useEffect } from "react";
import { Button, Card, PageHeader } from "@/components/admin/ui";

// Per-segment error boundary for /admin/*. Without this, any thrown
// server error in admin pages renders as a blank screen in production
// (and the dev overlay only catches client errors). Surfacing them
// inline keeps the founder unstuck.

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] page error:", error);
  }, [error]);

  return (
    <>
      <PageHeader
        title="Something went wrong"
        description="The admin route hit an error. The details below should help diagnose it."
      />
      <Card className="p-5">
        <p className="font-mono text-sm text-destructive">{error.message}</p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            digest: {error.digest}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <Button onClick={reset}>Try again</Button>
          <a
            href="/admin"
            className="inline-flex h-12 items-center justify-center rounded-md px-5 text-sm text-muted-foreground hover:text-foreground"
          >
            Back to overview
          </a>
        </div>
      </Card>
    </>
  );
}
