"use client";

import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/config/env";

/**
 * Route-level error boundary. Complements (does not replace)
 * `src/components/common/error-boundary.tsx`, which wraps smaller subtrees.
 * Never renders the raw error/stack in production — only in development.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (env.isDevelopment) {
      console.error("[route error]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-5" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            {env.isDevelopment ? error.message : "An unexpected error occurred. Please try again."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>
            <RotateCcwIcon />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
