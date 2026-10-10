import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Check, CircleCheck, CirclePlay, CircleX, Inbox, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConsultingStatus } from "@/types/consulting";
import { CONSULTING_STATUS_LABELS } from "./consulting-labels";

const STATUS_PRESENTATION: Record<
  ConsultingStatus,
  { icon: LucideIcon; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  SUBMITTED: { icon: Inbox, variant: "outline" },
  UNDER_REVIEW: { icon: Search, variant: "secondary" },
  ACCEPTED: { icon: CircleCheck, variant: "secondary" },
  IN_PROGRESS: { icon: CirclePlay, variant: "default" },
  COMPLETED: { icon: BadgeCheck, variant: "outline" },
  DECLINED: { icon: CircleX, variant: "destructive" },
};

/**
 * One status treatment for every Consulting surface. Uses semantic theme
 * tokens only, and always pairs a text label with a distinct icon so status
 * is never conveyed by color alone.
 */
export function ConsultingStatusBadge({
  status,
  className,
}: {
  status: ConsultingStatus;
  className?: string;
}) {
  const { icon: Icon, variant } = STATUS_PRESENTATION[status];
  return (
    <Badge variant={variant} className={cn("h-6 gap-1.5 px-2.5", className)}>
      <Icon aria-hidden="true" />
      {CONSULTING_STATUS_LABELS[status]}
    </Badge>
  );
}

/** The frozen WF-REQ happy path; DECLINED branches off UNDER_REVIEW (WF-REQ-04). */
const HAPPY_PATH: ConsultingStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
];
const DECLINED_PATH: ConsultingStatus[] = ["SUBMITTED", "UNDER_REVIEW", "DECLINED"];

/**
 * Lifecycle position derived only from the frozen workflow — no invented
 * steps, dates or percentages. A declined request shows its real terminal
 * branch instead of the delivery steps it will never reach.
 */
export function ConsultingLifecycle({ status }: { status: ConsultingStatus }) {
  const steps = status === "DECLINED" ? DECLINED_PATH : HAPPY_PATH;
  const currentIndex = steps.indexOf(status);
  const terminal = status === "COMPLETED" || status === "DECLINED";

  return (
    <ol
      aria-label="Request lifecycle"
      className={cn("grid gap-1", steps.length === 5 ? "grid-cols-5" : "grid-cols-3")}
    >
      {steps.map((step, index) => {
        const done = index < currentIndex || (terminal && index === currentIndex);
        const current = index === currentIndex;
        const declined = step === "DECLINED";
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
                declined && "border-destructive/50 bg-destructive/10 text-destructive",
                !declined && done && "border-primary bg-primary text-primary-foreground",
                !declined && current && !done && "border-foreground ring-3 ring-ring/30",
                !declined && !done && !current && "text-muted-foreground",
              )}
            >
              {declined ? (
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
              {CONSULTING_STATUS_LABELS[step]}
              {current && <span className="sr-only"> (current stage)</span>}
              {done && !current && <span className="sr-only"> (done)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
