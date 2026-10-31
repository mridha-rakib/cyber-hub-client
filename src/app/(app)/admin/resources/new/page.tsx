"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { classifyMutationError } from "@/features/learning-content/mutation-errors";
import {
  EMPTY_RESOURCE_FORM,
  ResourceForm,
  type ResourceFormErrors,
  toResourceCreateInput,
  validateResourceForm,
} from "@/features/learning-content/resource-form";
import { useCreateResource } from "@/hooks/use-resources";
import { showNotification } from "@/stores/notification.store";

/** UI-ADM-006 create (API-ADMRES-001): a new resource always starts as a DRAFT. */
export default function NewResourcePage() {
  const router = useRouter();
  const create = useCreateResource();
  const [values, setValues] = useState(EMPTY_RESOURCE_FORM);
  const [errors, setErrors] = useState<ResourceFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    const clientErrors = validateResourceForm(values);
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) {
      setFormError("Check the highlighted fields.");
      return;
    }
    try {
      const created = await create.mutateAsync(toResourceCreateInput(values));
      showNotification({ type: "success", message: "Draft resource created." });
      router.push(`/admin/resources/${created.id}`);
    } catch (error) {
      const info = classifyMutationError(error);
      setErrors(info.fieldErrors);
      setFormError(info.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/resources" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to learning resources
      </Link>
      <div>
        <h1 className="text-xl font-semibold">New learning resource</h1>
        <p className="text-sm text-muted-foreground">
          Saved as a draft. It becomes public only when you publish it.
        </p>
      </div>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Resource details</CardTitle>
          <CardDescription>All text is shown exactly as typed, as plain text.</CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <p className="mb-4 text-sm font-medium text-destructive" role="alert">
              {formError}
            </p>
          )}
          <ResourceForm
            values={values}
            onChange={setValues}
            errors={errors}
            disabled={create.isPending}
            onSubmit={submit}
            actions={
              <>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Creating…" : "Create draft"}
                </Button>
                <Button type="button" variant="ghost" asChild>
                  <Link href="/admin/resources">Cancel</Link>
                </Button>
              </>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
