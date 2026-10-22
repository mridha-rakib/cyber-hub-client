import type { LucideIcon } from "lucide-react";
import { Archive, BadgeCheck, ClipboardCheck, FilePen, FileSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReportStatus } from "@/types/security-report";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  READY_FOR_RELEASE: "Ready for release",
  RELEASED: "Released",
  SUPERSEDED: "Superseded",
};

const PRESENTATION: Record<ReportStatus, { icon: LucideIcon; variant: BadgeVariant }> = {
  DRAFT: { icon: FilePen, variant: "outline" },
  IN_REVIEW: { icon: FileSearch, variant: "secondary" },
  READY_FOR_RELEASE: { icon: ClipboardCheck, variant: "default" },
  RELEASED: { icon: BadgeCheck, variant: "default" },
  SUPERSEDED: { icon: Archive, variant: "secondary" },
};

/** Text + icon badge: status is never conveyed by colour alone. */
export function ReportStatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  const { icon: Icon, variant } = PRESENTATION[status];
  return (
    <Badge variant={variant} className={cn("h-6 gap-1.5 px-2.5", className)}>
      <Icon aria-hidden="true" />
      <span className="sr-only">Report status: </span>
      {REPORT_STATUS_LABELS[status]}
    </Badge>
  );
}
