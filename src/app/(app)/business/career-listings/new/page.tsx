"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateCareerListing } from "@/hooks/use-career";
import { isApiError } from "@/lib/errors/api-error";
import {
  CareerListingForm,
  type CareerListingFormValues,
  EMPTY_LISTING_FORM,
  toListingInput,
} from "../listing-form";

export default function NewCareerListingPage() {
  const router = useRouter();
  const createListing = useCreateCareerListing();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const handleSubmit = async (values: CareerListingFormValues) => {
    setFormError(null);
    setFieldErrors({});
    try {
      const created = await createListing.mutateAsync(toListingInput(values));
      router.push(`/business/career-listings/${created.id}`);
    } catch (error) {
      if (isApiError(error) && error.hasValidationErrors) {
        setFieldErrors({
          title: error.fieldError("title"),
          location: error.fieldError("location"),
          level: error.fieldError("level"),
          skills: error.fieldError("skills"),
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
        <h1 className="text-xl font-semibold">New career listing</h1>
        <p className="text-sm text-muted-foreground">
          Submitted listings go into admin review before they appear publicly.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Listing details</CardTitle>
          <CardDescription>Created directly into moderation review.</CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <p className="mb-4 text-sm font-medium text-destructive" role="alert">
              {formError}
            </p>
          )}
          <CareerListingForm
            initialValues={EMPTY_LISTING_FORM}
            onSubmit={handleSubmit}
            submitting={createListing.isPending}
            submitLabel="Submit for review"
            fieldErrors={fieldErrors}
          />
        </CardContent>
      </Card>
    </div>
  );
}
