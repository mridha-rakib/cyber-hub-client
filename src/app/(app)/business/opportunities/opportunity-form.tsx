"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  EmployerOpportunityInput,
  EmployerOpportunityType,
} from "@/types/employer-opportunity";

const OPPORTUNITY_TYPES: EmployerOpportunityType[] = ["INTERNSHIP_OPPORTUNITY", "STUDENT_PROJECT"];

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export interface OpportunityFormValues {
  type: EmployerOpportunityType;
  title: string;
  description: string;
  skills: string;
  applicationUrl: string;
}

export const EMPTY_OPPORTUNITY_FORM: OpportunityFormValues = {
  type: "INTERNSHIP_OPPORTUNITY",
  title: "",
  description: "",
  skills: "",
  applicationUrl: "",
};

export function toOpportunityInput(values: OpportunityFormValues): EmployerOpportunityInput {
  const skills = values.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    type: values.type,
    title: values.title.trim(),
    description: values.description.trim(),
    skills: skills.length > 0 ? skills : undefined,
    applicationUrl: values.applicationUrl.trim() || undefined,
  };
}

function isValid(values: OpportunityFormValues): boolean {
  return values.title.trim().length > 0 && values.description.trim().length > 0;
}

/**
 * Shared field set for API-BIZOPP-001 (create) and API-BIZOPP-004 (PATCH,
 * REJECTED only). `requirements` (a source-limited free-form object) is
 * intentionally not exposed here — no field-level UI is documented for it.
 */
export function OpportunityForm({
  initialValues,
  onSubmit,
  submitting,
  submitLabel,
  fieldErrors,
}: {
  initialValues: OpportunityFormValues;
  onSubmit: (values: OpportunityFormValues) => void | Promise<void>;
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
        <Label htmlFor="opportunity-type">Type</Label>
        <select
          id="opportunity-type"
          className={selectClassName}
          value={values.type}
          onChange={(e) =>
            setValues((v) => ({ ...v, type: e.target.value as EmployerOpportunityType }))
          }
        >
          {OPPORTUNITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="opportunity-title">Title</Label>
        <Input
          id="opportunity-title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          aria-invalid={Boolean(fieldErrors?.title)}
          aria-describedby={fieldErrors?.title ? "opportunity-title-error" : undefined}
        />
        {fieldErrors?.title && (
          <p id="opportunity-title-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="opportunity-description">Description</Label>
        <Textarea
          id="opportunity-description"
          rows={4}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          aria-invalid={Boolean(fieldErrors?.description)}
          aria-describedby={fieldErrors?.description ? "opportunity-description-error" : undefined}
        />
        {fieldErrors?.description && (
          <p id="opportunity-description-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="opportunity-skills">Skills</Label>
        <Input
          id="opportunity-skills"
          placeholder="e.g. Python, cloud security"
          value={values.skills}
          onChange={(e) => setValues((v) => ({ ...v, skills: e.target.value }))}
          aria-describedby="opportunity-skills-help"
        />
        <p id="opportunity-skills-help" className="text-xs text-muted-foreground">
          Optional. Separate each skill with a comma.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="opportunity-application-url">Application URL</Label>
        <Input
          id="opportunity-application-url"
          type="url"
          placeholder="https://"
          value={values.applicationUrl}
          onChange={(e) => setValues((v) => ({ ...v, applicationUrl: e.target.value }))}
          aria-invalid={Boolean(fieldErrors?.applicationUrl)}
          aria-describedby={
            fieldErrors?.applicationUrl
              ? "opportunity-application-url-help opportunity-application-url-error"
              : "opportunity-application-url-help"
          }
        />
        <p id="opportunity-application-url-help" className="text-xs text-muted-foreground">
          Optional approved application destination.
        </p>
        {fieldErrors?.applicationUrl && (
          <p
            id="opportunity-application-url-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {fieldErrors.applicationUrl}
          </p>
        )}
      </div>

      <Button type="submit" className="w-fit" disabled={submitting || !isValid(values)}>
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
