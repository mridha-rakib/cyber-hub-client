import { CalendarClock, Clock, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScopeAuthorization } from "@/types/consulting";
import {
  CONSULTING_SERVICE_LABELS,
  formatConsultingDateTime,
  isConsultingService,
  scopeEntries,
} from "./consulting-labels";

type Validity = "active" | "pending" | "ended" | "revoked";

/**
 * Describes the recorded validity window for display only. The backend's
 * AUTH_SCOPE guard remains the sole authority on whether work may proceed.
 */
function validityOf(scope: ScopeAuthorization, now = Date.now()): Validity {
  if (scope.revokedAt) return "revoked";
  if (new Date(scope.validFrom).getTime() > now) return "pending";
  if (scope.validUntil && new Date(scope.validUntil).getTime() < now) return "ended";
  return "active";
}

const VALIDITY_PRESENTATION: Record<Validity, { label: string; icon: typeof ShieldCheck }> = {
  active: { label: "Within validity window", icon: ShieldCheck },
  pending: { label: "Not yet in effect", icon: Clock },
  ended: { label: "Validity period ended", icon: ShieldOff },
  revoked: { label: "Revoked", icon: ShieldOff },
};

export function ScopeAuthorizationSummary({
  scope,
  audience,
}: {
  scope: ScopeAuthorization | null;
  audience: "business" | "operational";
}) {
  if (!scope) {
    return (
      <div className="rounded-xl border border-dashed p-5">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="size-4 text-muted-foreground" aria-hidden="true" />
          No current scope authorisation
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {audience === "business"
            ? "Technical work on this request cannot start until you confirm exactly which targets and activities are authorised."
            : "The Business has not confirmed a current scope. Technical delivery cannot start until they do — assignment and acceptance are not authorisation."}
        </p>
      </div>
    );
  }

  const validity = validityOf(scope);
  const { label: validityLabel, icon: ValidityIcon } = VALIDITY_PRESENTATION[validity];
  const targets = scopeEntries(scope.authorizedTargets);
  const activities = scopeEntries(scope.allowedActivities);
  const restrictions = scopeEntries(scope.restrictions);

  return (
    <section
      aria-label={`Scope authorisation version ${scope.versionNo}`}
      className="rounded-xl border bg-muted/30 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Version {scope.versionNo}
          {scope.isCurrent && <Badge variant="outline">Current</Badge>}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium",
            validity === "active" ? "text-foreground" : "text-destructive",
          )}
        >
          <ValidityIcon className="size-3.5" aria-hidden="true" />
          {validityLabel}
        </span>
      </div>

      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <ScopeList title="Authorised targets" values={targets} mono />
        <ScopeList
          title="Allowed activities"
          values={activities.map((activity) =>
            isConsultingService(activity) ? CONSULTING_SERVICE_LABELS[activity] : activity,
          )}
        />
        <ScopeList
          title="Restrictions"
          values={restrictions}
          empty="No additional restrictions recorded"
        />
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">Validity window</dt>
          <dd className="mt-1.5 space-y-1 text-sm">
            <p className="flex items-start gap-1.5">
              <CalendarClock
                className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span>
                From {formatConsultingDateTime(scope.validFrom)}
                <br />
                {scope.validUntil
                  ? `Until ${formatConsultingDateTime(scope.validUntil)}`
                  : "No end date recorded"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Confirmed {formatConsultingDateTime(scope.confirmedAt)}
            </p>
          </dd>
        </div>
      </dl>
    </section>
  );
}

function ScopeList({
  title,
  values,
  mono = false,
  empty = "None recorded",
}: {
  title: string;
  values: string[];
  mono?: boolean;
  empty?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{title}</dt>
      <dd className="mt-1.5">
        {values.length > 0 ? (
          <ul className="space-y-1.5">
            {values.map((value) => (
              <li
                key={value}
                className={cn(
                  "rounded-md border bg-background px-2.5 py-1.5 text-sm break-words",
                  mono && "font-mono text-[0.8rem]",
                )}
              >
                {value}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </dd>
    </div>
  );
}
