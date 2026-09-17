import { Badge } from "@/components/ui/badge";

const VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  PUBLISHED: "default",
  CLOSED: "secondary",
  ARCHIVED: "outline",
  SUBMITTED: "secondary",
  UNDER_REVIEW: "default",
  ACCEPTED: "default",
  REJECTED: "destructive",
  APPROVED: "default",
  REVISION_REQUIRED: "destructive",
  NOT_ELIGIBLE: "outline",
  ELIGIBLE: "default",
};

/**
 * Renders a workflow/gate status value as a badge. Status is never conveyed
 * by color alone — the text label is always present too (Wave 1 §44).
 */
export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANTS[status] ?? "outline"}>{status.replaceAll("_", " ")}</Badge>;
}
