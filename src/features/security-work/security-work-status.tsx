import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  CircleAlert,
  CircleCheck,
  CircleDot,
  CirclePlay,
  CircleX,
  Info,
  OctagonAlert,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AssessmentStatus, FindingSeverity, FindingStatus } from "@/types/security-work";
import {
  ASSESSMENT_STATUS_LABELS,
  FINDING_SEVERITY_LABELS,
  FINDING_STATUS_LABELS,
} from "./security-work-labels";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const ASSESSMENT_PRESENTATION: Record<
  AssessmentStatus,
  { icon: LucideIcon; variant: BadgeVariant }
> = {
  PLANNED: { icon: CalendarClock, variant: "outline" },
  IN_PROGRESS: { icon: CirclePlay, variant: "default" },
  COMPLETED: { icon: BadgeCheck, variant: "secondary" },
  CANCELLED: { icon: CircleX, variant: "destructive" },
};

const FINDING_PRESENTATION: Record<FindingStatus, { icon: LucideIcon; variant: BadgeVariant }> = {
  OPEN: { icon: CircleDot, variant: "outline" },
  REMEDIATION_IN_PROGRESS: { icon: Wrench, variant: "secondary" },
  RESOLVED: { icon: CircleCheck, variant: "default" },
};

const SEVERITY_PRESENTATION: Record<FindingSeverity, { icon: LucideIcon; variant: BadgeVariant }> =
  {
    CRITICAL: { icon: OctagonAlert, variant: "destructive" },
    HIGH: { icon: TriangleAlert, variant: "destructive" },
    MEDIUM: { icon: CircleAlert, variant: "secondary" },
    LOW: { icon: Info, variant: "outline" },
  };

/**
 * Status/severity treatments for every security-work surface. Semantic
 * theme tokens only, and always a text label with a distinct icon so the
 * meaning is never conveyed by color alone.
 */
export function AssessmentStatusBadge({
  status,
  className,
}: {
  status: AssessmentStatus;
  className?: string;
}) {
  const { icon: Icon, variant } = ASSESSMENT_PRESENTATION[status];
  return (
    <Badge variant={variant} className={cn("h-6 gap-1.5 px-2.5", className)}>
      <Icon aria-hidden="true" />
      {ASSESSMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function FindingStatusBadge({
  status,
  className,
}: {
  status: FindingStatus;
  className?: string;
}) {
  const { icon: Icon, variant } = FINDING_PRESENTATION[status];
  return (
    <Badge variant={variant} className={cn("h-6 gap-1.5 px-2.5", className)}>
      <Icon aria-hidden="true" />
      {FINDING_STATUS_LABELS[status]}
    </Badge>
  );
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: FindingSeverity;
  className?: string;
}) {
  const { icon: Icon, variant } = SEVERITY_PRESENTATION[severity];
  return (
    <Badge variant={variant} className={cn("h-6 gap-1.5 px-2.5", className)}>
      <Icon aria-hidden="true" />
      <span className="sr-only">Severity: </span>
      {FINDING_SEVERITY_LABELS[severity]}
    </Badge>
  );
}

/**
 * Lifecycle position derived only from WF-ASM. A cancelled assessment shows
 * its real branch: from PLANNED (WF-ASM-04), or from IN_PROGRESS when the
 * server recorded a start (WF-ASM-05).
 */
export function AssessmentLifecycle({
  status,
  started,
}: {
  status: AssessmentStatus;
  started: boolean;
}) {
  const steps: AssessmentStatus[] =
    status === "CANCELLED"
      ? started
        ? ["PLANNED", "IN_PROGRESS", "CANCELLED"]
        : ["PLANNED", "CANCELLED"]
      : ["PLANNED", "IN_PROGRESS", "COMPLETED"];
  const currentIndex = steps.indexOf(status);
  const terminal = status === "COMPLETED" || status === "CANCELLED";

  return (
    <ol
      aria-label="Assessment lifecycle"
      className={cn("grid gap-1", steps.length === 3 ? "grid-cols-3" : "grid-cols-2")}
    >
      {steps.map((step, index) => {
        const done = index < currentIndex || (terminal && index === currentIndex);
        const current = index === currentIndex;
        const cancelled = step === "CANCELLED";
        return (
          <li
            key={step}
            aria-current={current ? "step" : undefined}
            className="relative flex flex-col items-center gap-2 text-center"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-3 right-1/2 h-px w-full -translate-y-1/2",
                  index <= currentIndex ? "bg-foreground/40" : "bg-border",
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex size-6 items-center justify-center rounded-full border bg-background text-[0.7rem] font-medium",
                cancelled && "border-destructive/50 bg-destructive/10 text-destructive",
                !cancelled && done && "border-primary bg-primary text-primary-foreground",
                !cancelled && current && !done && "border-foreground ring-3 ring-ring/30",
                !cancelled && !done && !current && "text-muted-foreground",
              )}
            >
              {cancelled ? (
                <CircleX className="size-3.5" />
              ) : done ? (
                <Check className="size-3.5" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "text-[0.7rem] leading-tight sm:text-xs",
                current ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {ASSESSMENT_STATUS_LABELS[step]}
              {current && <span className="sr-only"> (current stage)</span>}
              {done && !current && <span className="sr-only"> (done)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
