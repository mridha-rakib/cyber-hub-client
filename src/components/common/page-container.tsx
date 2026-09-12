import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * `common/` holds composed, app-aware components shared across features
 * (layout shells, headers, empty states, etc.).
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-5xl px-4 py-8", className)}>{children}</div>;
}
