"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateOpportunity } from "@/hooks/use-employer-opportunity";
import { isApiError } from "@/lib/errors/api-error";
import {
  EMPTY_OPPORTUNITY_FORM,
  OpportunityForm,
  type OpportunityFormValues,
  toOpportunityInput,
} from "../opportunity-form";

export default function NewOpportunityPage() {
  const router = useRouter();
  const createOpportunity = useCreateOpportunity();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const handleSubmit = async (values: OpportunityFormValues) => {
    setFormError(null);
    setFieldErrors({});
    try {
      const created = await createOpportunity.mutateAsync(toOpportunityInput(values));
      router.push(`/business/opportunities/${created.id}`);
    } catch (error) {
      if (isApiError(error) && error.hasValidationErrors) {
        setFieldErrors({
          title: error.fieldError("title"),
          description: error.fieldError("description"),
          applicationUrl: error.fieldError("applicationUrl"),
        });
        return;
      }
      setFormError(isApiError(error) ? error.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">New opportunity</h1>
        <p className="text-sm text-muted-foreground">
          Submitted opportunities go into admin review before they appear publicly.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Opportunity details</CardTitle>
          <CardDescription>Created directly into moderation review.</CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <p className="mb-4 text-sm font-medium text-destructive" role="alert">
              {formError}
            </p>
          )}
          <OpportunityForm
            initialValues={EMPTY_OPPORTUNITY_FORM}
            onSubmit={handleSubmit}
            submitting={createOpportunity.isPending}
            submitLabel="Submit for review"
            fieldErrors={fieldErrors}
          />
        </CardContent>
      </Card>
    </div>
  );
}
