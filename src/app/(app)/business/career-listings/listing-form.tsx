"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessCareerListingInput, CareerListingType } from "@/types/career";

const LISTING_TYPES: CareerListingType[] = ["JOB", "INTERNSHIP", "GRADUATE_ROLE", "APPRENTICESHIP"];

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export interface CareerListingFormValues {
  title: string;
  location: string;
  level: string;
  skills: string;
  applicationUrl: string;
  listingType: CareerListingType;
  remoteUk: boolean;
}

export const EMPTY_LISTING_FORM: CareerListingFormValues = {
  title: "",
  location: "",
  level: "",
  skills: "",
  applicationUrl: "",
  listingType: "JOB",
  remoteUk: false,
};

export function toListingInput(values: CareerListingFormValues): BusinessCareerListingInput {
  return {
    title: values.title.trim(),
    location: values.location.trim(),
    level: values.level.trim(),
    applicationUrl: values.applicationUrl.trim(),
    listingType: values.listingType,
    remoteUk: values.remoteUk,
    skills: values.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function isValid(values: CareerListingFormValues): boolean {
  return (
    values.title.trim().length > 0 &&
    values.location.trim().length > 0 &&
    values.level.trim().length > 0 &&
    values.applicationUrl.trim().length > 0 &&
    values.skills.trim().length > 0
  );
}

/**
 * Shared field set for API-BIZCAR-001 (create) and API-BIZCAR-004 (PATCH,
 * REJECTED only). Fields mirror `BusinessCareerListingInput` exactly —
 * `employerId`/`employerName`/`status`/`stateVersion`/`publishedAt` are
 * server-owned and never appear here.
 */
export function CareerListingForm({
  initialValues,
  onSubmit,
  submitting,
  submitLabel,
  fieldErrors,
}: {
  initialValues: CareerListingFormValues;
  onSubmit: (values: CareerListingFormValues) => void | Promise<void>;
  submitting: boolean;
  submitLabel: string;
  fieldErrors?: Record<string, string | undefined>;
}) {
  const [values, setValues] = useState(initialValues);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!submitting && isValid(values)) onSubmit(values);
      }}
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="listing-title">Title</Label>
        <Input
          id="listing-title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          aria-invalid={Boolean(fieldErrors?.title)}
          aria-describedby={fieldErrors?.title ? "listing-title-error" : undefined}
        />
        {fieldErrors?.title && (
          <p id="listing-title-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="listing-location">Location</Label>
          <Input
            id="listing-location"
            placeholder="e.g. London"
            value={values.location}
            onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
            aria-invalid={Boolean(fieldErrors?.location)}
            aria-describedby={fieldErrors?.location ? "listing-location-error" : undefined}
          />
          {fieldErrors?.location && (
            <p id="listing-location-error" className="text-sm text-destructive" role="alert">
              {fieldErrors.location}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="listing-level">Level</Label>
          <Input
            id="listing-level"
            placeholder="e.g. Junior"
            value={values.level}
            onChange={(e) => setValues((v) => ({ ...v, level: e.target.value }))}
            aria-invalid={Boolean(fieldErrors?.level)}
            aria-describedby={fieldErrors?.level ? "listing-level-error" : undefined}
          />
          {fieldErrors?.level && (
            <p id="listing-level-error" className="text-sm text-destructive" role="alert">
              {fieldErrors.level}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="listing-type">Listing type</Label>
        <select
          id="listing-type"
          className={selectClassName}
          value={values.listingType}
          onChange={(e) =>
            setValues((v) => ({ ...v, listingType: e.target.value as CareerListingType }))
          }
        >
          {LISTING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="listing-skills">Skills</Label>
        <Input
          id="listing-skills"
          placeholder="e.g. SOC, SIEM, incident response"
          value={values.skills}
          onChange={(e) => setValues((v) => ({ ...v, skills: e.target.value }))}
          aria-invalid={Boolean(fieldErrors?.skills)}
          aria-describedby={
            fieldErrors?.skills ? "listing-skills-help listing-skills-error" : "listing-skills-help"
          }
        />
        <p id="listing-skills-help" className="text-xs text-muted-foreground">
          Separate each skill with a comma.
        </p>
        {fieldErrors?.skills && (
          <p id="listing-skills-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.skills}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="listing-application-url">Application URL</Label>
        <Input
          id="listing-application-url"
          type="url"
          placeholder="https://"
          value={values.applicationUrl}
          onChange={(e) => setValues((v) => ({ ...v, applicationUrl: e.target.value }))}
          aria-invalid={Boolean(fieldErrors?.applicationUrl)}
          aria-describedby={
            fieldErrors?.applicationUrl
              ? "listing-application-url-help listing-application-url-error"
              : "listing-application-url-help"
          }
        />
        <p id="listing-application-url-help" className="text-xs text-muted-foreground">
          Candidates are sent here to apply once this listing is published.
        </p>
        {fieldErrors?.applicationUrl && (
          <p id="listing-application-url-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.applicationUrl}
          </p>
        )}
      </div>

      <label htmlFor="listing-remote-uk" className="flex w-fit items-center gap-2 text-sm">
        <Checkbox
          id="listing-remote-uk"
          checked={values.remoteUk}
          onCheckedChange={(checked) => setValues((v) => ({ ...v, remoteUk: checked === true }))}
        />
        Remote UK
      </label>

      <Button type="submit" className="w-fit" disabled={submitting || !isValid(values)}>
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
