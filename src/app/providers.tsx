"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ErrorBoundary } from "@/components/common/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getQueryClient } from "@/config/query-client";

/**
 * Client-side provider tree. Add additional context providers (auth, etc.)
 * by nesting them inside here.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
