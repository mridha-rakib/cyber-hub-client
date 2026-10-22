"use client";

import { useState } from "react";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/config/navigation";
import { EMPLOYER_STATUS_LABELS } from "@/features/admin-governance/admin-governance-ui";
import { ConfirmPanel } from "@/features/consulting/lifecycle-actions";
import {
  useChangeUserRole,
  useUpdateEmployerProfile,
  useUpdateEmployerStatus,
} from "@/hooks/use-admin-governance";
import { useZodForm } from "@/hooks/use-zod-form";
import { isApiError } from "@/lib/errors/api-error";
import { EMPLOYER_STATUSES } from "@/schemas/admin-governance.schema";
import { showNotification } from "@/stores/notification.store";
import type { AdminEmployerDetail, AdminUserView, EmployerStatus } from "@/types/admin-governance";
import type { Role } from "@/types/auth";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 sm:w-64 dark:bg-input/30";

/** D7: the generic role change never offers or removes ROLE_BUSINESS. */
const ASSIGNABLE_ROLES: readonly Role[] = [
  "ROLE_LEARNER",
  "ROLE_MENTOR",
  "ROLE_CONSULTANT",
  "ROLE_ADMIN",
];

/** Server-provided safe messages for expected rejections; anything else stays generic. */
function mutationErrorMessage(error: unknown): string {
  if (!isApiError(error)) return "Something went wrong. Nothing was changed.";
  if (error.status === 401) return "Your session has ended. Sign in again to continue.";
  if (error.status === 404) return "This record no longer exists.";
  if ([403, 409, 422].includes(error.status ?? 0)) return error.message;
  return "The change could not be saved. Nothing was changed; please try again.";
}

/**
 * UI-ADM-003 role change (API-ADM-003). The backend enforces every D7 rule
 * (self change, ROLE_BUSINESS, last Admin) under row locks; these checks only
 * avoid offering an action the server will refuse.
 */
export function RoleChangePanel({
  user,
  actorUserId,
}: {
  user: AdminUserView;
  actorUserId: string;
}) {
  const change = useChangeUserRole(user.id);
  const [selected, setSelected] = useState<Role | "">("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = ASSIGNABLE_ROLES.filter((role) => role !== user.role);

  let unavailable: string | null = null;
  if (user.id === actorUserId) unavailable = "You can't change your own role.";
  else if (user.role === "ROLE_BUSINESS") {
    unavailable =
      "Business account roles can't be changed here: they are linked to a business, and that change needs a separate approved workflow.";
  }

  const submit = async () => {
    if (!selected) return;
    setError(null);
    try {
      await change.mutateAsync(selected);
      showNotification({
        type: "success",
        message: `Role changed to ${ROLE_LABELS[selected]}. Their existing sessions have ended.`,
      });
      setSelected("");
      setConfirming(false);
    } catch (caught) {
      setError(mutationErrorMessage(caught));
      setConfirming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Role</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">
          Current role: <span className="font-medium">{ROLE_LABELS[user.role]}</span>
        </p>
        {unavailable ? (
          <p className="text-sm text-muted-foreground">{unavailable}</p>
        ) : confirming && selected ? (
          <ConfirmPanel
            title="Confirm role change"
            confirmLabel={change.isPending ? "Changing…" : "Change role"}
            pending={change.isPending}
            onConfirm={submit}
            onCancel={() => setConfirming(false)}
          >
            <p>
              Change {user.name} from {ROLE_LABELS[user.role]} to {ROLE_LABELS[selected]}?
            </p>
            <p>
              This signs them out: their existing sessions stop working and they must sign in again.
              The change is recorded in the audit log.
            </p>
          </ConfirmPanel>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-change-select">New role</Label>
              <select
                id="role-change-select"
                className={selectClassName}
                value={selected}
                onChange={(event) => setSelected(event.target.value as Role | "")}
              >
                <option value="">Select a role…</option>
                {options.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!selected}
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
            >
              Review change
            </Button>
          </div>
        )}
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

const employerProfileFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(200, "Use 200 characters or fewer"),
  email: z.string().trim().max(320).pipe(z.email("Enter a valid email address")),
});

/** UI-ADM-005 profile edit (API-ADM-006): sends only the fields that changed. */
export function EmployerProfileForm({ employer }: { employer: AdminEmployerDetail }) {
  const update = useUpdateEmployerProfile(employer.id);
  const form = useZodForm(employerProfileFormSchema, {
    values: { companyName: employer.companyName, email: employer.email },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const changes: { companyName?: string; email?: string } = {};
    if (values.companyName !== employer.companyName) changes.companyName = values.companyName;
    if (values.email !== employer.email) changes.email = values.email;
    if (Object.keys(changes).length === 0) {
      form.reset({ companyName: employer.companyName, email: employer.email });
      return;
    }
    try {
      await update.mutateAsync(changes);
      showNotification({ type: "success", message: "Business profile updated." });
    } catch (caught) {
      if (isApiError(caught) && caught.status === 422) {
        for (const field of ["companyName", "email"] as const) {
          const message = caught.fieldError(field);
          if (message) form.setError(field, { message });
        }
      }
      form.setError("root", { message: mutationErrorMessage(caught) });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="flex flex-col gap-4 sm:max-w-md" onSubmit={onSubmit} noValidate>
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root?.message && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={!form.formState.isDirty || update.isPending}>
                {update.isPending ? "Saving…" : "Save profile"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!form.formState.isDirty || update.isPending}
                onClick={() =>
                  form.reset({ companyName: employer.companyName, email: employer.email })
                }
              >
                Discard changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export const STATUS_RECORD_NOTE =
  "Status is an administrative record only. It does not block sign-in, end sessions or limit this business's access.";

/** UI-ADM-005 status change (API-ADM-007) under D8 record-only semantics. */
export function EmployerStatusPanel({ employer }: { employer: AdminEmployerDetail }) {
  const update = useUpdateEmployerStatus(employer.id);
  const [selected, setSelected] = useState<EmployerStatus | "">("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = EMPLOYER_STATUSES.filter((status) => status !== employer.status);

  const submit = async () => {
    if (!selected) return;
    setError(null);
    try {
      await update.mutateAsync(selected);
      showNotification({
        type: "success",
        message: `Status recorded as ${EMPLOYER_STATUS_LABELS[selected]}.`,
      });
      setSelected("");
      setConfirming(false);
    } catch (caught) {
      setError(mutationErrorMessage(caught));
      setConfirming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">
          Current status:{" "}
          <span className="font-medium">{EMPLOYER_STATUS_LABELS[employer.status]}</span>
        </p>
        <p className="text-sm text-muted-foreground">{STATUS_RECORD_NOTE}</p>
        {confirming && selected ? (
          <ConfirmPanel
            title="Confirm status change"
            confirmLabel={update.isPending ? "Saving…" : "Record status"}
            pending={update.isPending}
            onConfirm={submit}
            onCancel={() => setConfirming(false)}
          >
            <p>
              Record {employer.companyName} as {EMPLOYER_STATUS_LABELS[selected]} (currently{" "}
              {EMPLOYER_STATUS_LABELS[employer.status]})?
            </p>
            <p>
              Its users keep their current access and sessions. The change is recorded in the audit
              log.
            </p>
          </ConfirmPanel>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="employer-status-select">New status</Label>
              <select
                id="employer-status-select"
                className={selectClassName}
                value={selected}
                onChange={(event) => setSelected(event.target.value as EmployerStatus | "")}
              >
                <option value="">Select a status…</option>
                {options.map((status) => (
                  <option key={status} value={status}>
                    {EMPLOYER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!selected}
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
            >
              Review change
            </Button>
          </div>
        )}
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
