"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("App route error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="surface-panel max-w-lg space-y-4 p-8">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        We ran into an error while loading this section.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
