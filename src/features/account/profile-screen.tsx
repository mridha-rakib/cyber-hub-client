"use client";

import Link from "next/link";
import { z } from "zod";

import { ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
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
  Field,
  formatUtc,
  RoleBadge,
  VerifiedBadge,
} from "@/features/admin-governance/admin-governance-ui";
import { useAccountSelf, useUpdateAccountProfile } from "@/hooks/use-account";
import { useZodForm } from "@/hooks/use-zod-form";
import { isApiError } from "@/lib/errors/api-error";
import { showNotification } from "@/stores/notification.store";
import type { UserSelfView } from "@/types/account";

const profileFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

/**
 * UI-ACC-001 My Profile (API-ACC-001/002). Only the name is editable: no
 * profile field is approved yet, and email, role, verification and business
 * link are account facts the server never lets this screen change.
 */
export function ProfileScreen() {
  const { data: user, isPending, isError, error, refetch } = useAccountSelf();

  if (isPending) return <PageLoading />;
  if (isError && isApiError(error) && error.status === 403) return <ForbiddenState />;
  if (isError || !user) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">My profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account details. Only your display name can be changed here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-3">
            <Field label="Name">{user.name}</Field>
            <Field label="Email">{user.email}</Field>
            <Field label="Role">
              <RoleBadge role={user.role} />
            </Field>
            <Field label="Email verification">
              <VerifiedBadge verified={user.verified} />
            </Field>
            <Field label="Member since">{formatUtc(user.createdAt)}</Field>
            <Field label="Last updated">{formatUtc(user.updatedAt)}</Field>
            {user.deletionRequestedAt && (
              <Field label="Deletion request">Received {formatUtc(user.deletionRequestedAt)}</Field>
            )}
          </dl>
        </CardContent>
      </Card>

      <NameForm user={user} />

      <Card>
        <CardContent className="flex flex-col gap-2 pt-6 text-sm text-muted-foreground">
          {user.role === "ROLE_BUSINESS" && (
            <Link href="/business/settings/profile" className="underline underline-offset-2">
              Edit your business profile
            </Link>
          )}
          <Link href="/account/delete" className="underline underline-offset-2">
            Account deletion request
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function NameForm({ user }: { user: UserSelfView }) {
  const update = useUpdateAccountProfile();
  const form = useZodForm(profileFormSchema, { values: { name: user.name } });

  const onSubmit = form.handleSubmit(async ({ name }) => {
    if (name === user.name) {
      form.reset({ name: user.name });
      return;
    }
    try {
      await update.mutateAsync({ name });
      showNotification({ type: "success", message: "Profile updated." });
    } catch (caught) {
      const fieldMessage = isApiError(caught) ? caught.fieldError("name") : undefined;
      if (fieldMessage) form.setError("name", { message: fieldMessage });
      form.setError("root", { message: accountMutationMessage(caught) });
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input id="profile-name" autoComplete="name" {...field} />
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
                onClick={() => form.reset({ name: user.name })}
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
