"use client";

import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { Component, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/config/env";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of the default fallback UI when provided. */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Called with the error, e.g. to report it to a logging service. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches unexpected React rendering errors (component crashes) in its
 * subtree and shows a fallback UI instead of unmounting the whole app.
 *
 * This complements, and does not replace, Next.js's route-level
 * `error.tsx` files — use those for whole-route recovery, and wrap smaller
 * high-risk subtrees (widgets, feature panels) with this component so one
 * broken part doesn't take down the rest of the page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (env.isDevelopment) {
      console.error("[ErrorBoundary]", error, info);
    }
    this.props.onError?.(error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const { fallback } = this.props;
    if (typeof fallback === "function") {
      return fallback(error, this.reset);
    }
    if (fallback) {
      return fallback;
    }

    return <DefaultErrorFallback error={error} reset={this.reset} />;
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
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
