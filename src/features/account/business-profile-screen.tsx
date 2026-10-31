"use client";

import { z } from "zod";

import { ErrorState, ForbiddenState, NotFoundState, PageLoading } from "@/components/common/states";
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
import { accountMutationMessage } from "@/features/account/account-errors";
import {
  EmployerStatusBadge,
  Field,
  formatUtc,
  Mono,
} from "@/features/admin-governance/admin-governance-ui";
import { useBusinessProfile, useUpdateBusinessProfile } from "@/hooks/use-account";
import { useZodForm } from "@/hooks/use-zod-form";
import { isApiError } from "@/lib/errors/api-error";
import { showNotification } from "@/stores/notification.store";
import type { BusinessProfileUpdate, BusinessSelfView } from "@/types/account";

const businessFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(200, "Use 200 characters or fewer"),
  email: z.string().trim().max(320).pipe(z.email("Enter a valid email address")),
});

/**
 * UI-ACC-002 / UI-BIZ-002 Business Profile (API-ACC-003/004). The server
 * scopes both calls to the signed-in user's own business (ORG). Status is
 * shown read-only: it is an administrative record set by Admins (D7/D8).
 */
export function BusinessProfileScreen() {
  const { data: employer, isPending, isError, error, refetch } = useBusinessProfile();

  if (isPending) return <PageLoading />;
  if (isError && isApiError(error) && error.status === 403) return <ForbiddenState />;
  if (isError && isApiError(error) && error.status === 404) return <NotFoundState />;
  if (isError || !employer) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold break-words">Business profile</h1>
        <p className="text-sm text-muted-foreground">How your business appears on the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-3">
            <Field label="Business ID">
              <Mono>{employer.id}</Mono>
            </Field>
            <Field label="Company name">{employer.companyName}</Field>
            <Field label="Contact email">{employer.email}</Field>
            <Field label="Status">
              <EmployerStatusBadge status={employer.status} />
            </Field>
            <Field label="Created">{formatUtc(employer.createdAt)}</Field>
            <Field label="Last updated">{formatUtc(employer.updatedAt)}</Field>
          </dl>
          <p className="mt-3 text-sm text-muted-foreground">
            Status is managed by platform administrators and can't be changed here.
          </p>
        </CardContent>
      </Card>

      <BusinessProfileForm employer={employer} />
    </div>
  );
}

function BusinessProfileForm({ employer }: { employer: BusinessSelfView }) {
  const update = useUpdateBusinessProfile();
  const current = { companyName: employer.companyName, email: employer.email };
  const form = useZodForm(businessFormSchema, { values: current });

  const onSubmit = form.handleSubmit(async (values) => {
    const changes: BusinessProfileUpdate = {};
    if (values.companyName !== employer.companyName) changes.companyName = values.companyName;
    if (values.email !== employer.email) changes.email = values.email;
    if (Object.keys(changes).length === 0) {
      form.reset(current);
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
      form.setError("root", { message: accountMutationMessage(caught) });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit business profile</CardTitle>
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
                    <Input id="business-companyName" autoComplete="organization" {...field} />
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
                    <Input id="business-email" type="email" autoComplete="email" {...field} />
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
                {update.isPending ? "Saving…" : "Save business profile"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!form.formState.isDirty || update.isPending}
                onClick={() => form.reset(current)}
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
