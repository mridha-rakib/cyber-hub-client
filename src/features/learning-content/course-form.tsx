"use client";

import type * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isSafeHttpsUrl, selectClassName } from "@/features/learning-content/content-ui";
import type { AdminCourse, CourseCreateInput, CourseUpdateInput } from "@/types/course";

export type AffiliateDeclaration = "yes" | "no" | "undeclared";

export interface CourseFormValues {
  title: string;
  provider: string;
  category: string;
  level: string;
  originalPrice: string;
  discountedPrice: string;
  currency: string;
  externalUrl: string;
  /** `datetime-local` value in the viewer's time zone; empty = no expiry. */
  expiresAt: string;
  affiliate: AffiliateDeclaration;
  affiliateDisclosure: string;
}

export type CourseFormErrors = Partial<Record<keyof CourseFormValues, string>>;

export const EMPTY_COURSE_FORM: CourseFormValues = {
  title: "",
  provider: "",
  category: "",
  level: "",
  originalPrice: "",
  discountedPrice: "",
  currency: "GBP",
  externalUrl: "",
  expiresAt: "",
  affiliate: "undeclared",
  affiliateDisclosure: "",
};

const PRICE_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/** ISO timestamp -> `datetime-local` string in local time (minute precision). */
function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** `datetime-local` string -> ISO 8601 UTC timestamp, or null when empty. */
function toIsoOrNull(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Exact comparison in pence/cents, never floating point. */
function toMinorUnits(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

export function courseToFormValues(course: AdminCourse): CourseFormValues {
  return {
    title: course.title,
    provider: course.provider,
    category: course.category,
    level: course.level,
    originalPrice: course.originalPrice,
    discountedPrice: course.discountedPrice,
    currency: course.currency,
    externalUrl: course.externalUrl,
    expiresAt: toLocalInput(course.expiresAt),
    affiliate:
      course.hasAffiliateRelationship === true
        ? "yes"
        : course.hasAffiliateRelationship === false
          ? "no"
          : "undeclared",
    affiliateDisclosure: course.affiliateDisclosure ?? "",
  };
}

export function validateCourseForm(values: CourseFormValues): CourseFormErrors {
  const errors: CourseFormErrors = {};
  for (const key of ["title", "provider", "category", "level"] as const) {
    if (!values[key].trim()) errors[key] = "Required.";
  }
  const original = values.originalPrice.trim();
  const discounted = values.discountedPrice.trim();
  if (!PRICE_PATTERN.test(original)) {
    errors.originalPrice = "Enter an amount such as 49 or 49.99.";
  }
  if (!PRICE_PATTERN.test(discounted)) {
    errors.discountedPrice = "Enter an amount such as 29 or 29.99.";
  } else if (PRICE_PATTERN.test(original) && toMinorUnits(discounted) > toMinorUnits(original)) {
    errors.discountedPrice = "The deal price can't be higher than the original price.";
  }
  if (!CURRENCY_PATTERN.test(values.currency.trim())) {
    errors.currency = "Use a three-letter uppercase code, e.g. GBP.";
  }
  const url = values.externalUrl.trim();
  if (!url) errors.externalUrl = "Required.";
  else if (url.length > 2048 || !isSafeHttpsUrl(url)) {
    errors.externalUrl = "Must be a full https:// address without credentials.";
  }
  if (values.expiresAt && toIsoOrNull(values.expiresAt) === null) {
    errors.expiresAt = "Enter a valid date and time.";
  }
  if (values.affiliate === "yes" && !values.affiliateDisclosure.trim()) {
    errors.affiliateDisclosure = "A disclosure is required for an affiliate relationship.";
  }
  return errors;
}

export function toCourseCreateInput(values: CourseFormValues): CourseCreateInput {
  return {
    title: values.title.trim(),
    provider: values.provider.trim(),
    category: values.category.trim(),
    level: values.level.trim(),
    originalPrice: values.originalPrice.trim(),
    discountedPrice: values.discountedPrice.trim(),
    currency: values.currency.trim(),
    externalUrl: values.externalUrl.trim(),
    expiresAt: toIsoOrNull(values.expiresAt),
    hasAffiliateRelationship:
      values.affiliate === "yes" ? true : values.affiliate === "no" ? false : null,
    affiliateDisclosure: values.affiliate === "yes" ? values.affiliateDisclosure.trim() : null,
  };
}

/**
 * PATCH body containing only the fields that changed from the displayed
 * record (untouched fields, including the expiry timestamp, are never
 * resent). Returns null when nothing changed.
 */
export function toCourseUpdateInput(
  initial: CourseFormValues,
  values: CourseFormValues,
  expectedStateVersion: number,
): CourseUpdateInput | null {
  const next = toCourseCreateInput(values);
  const before = toCourseCreateInput(initial);
  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(next) as (keyof CourseCreateInput)[]) {
    if (key === "expiresAt") {
      if (values.expiresAt !== initial.expiresAt) patch.expiresAt = next.expiresAt;
    } else if (next[key] !== before[key]) {
      patch[key] = next[key];
    }
  }
  return Object.keys(patch).length === 0
    ? null
    : ({ ...patch, expectedStateVersion } as CourseUpdateInput);
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/**
 * Controlled field set for API-ADMCRS-001 (create) and API-ADMCRS-002 (edit,
 * DRAFT/REJECTED only). The parent owns the values so they survive a refetch
 * after a 409 (UI-DEC-030). Approval status, verification note, rejection
 * reason and stateVersion are never form fields.
 */
export function CourseForm({
  values,
  onChange,
  errors,
  disabled,
  onSubmit,
  actions,
}: {
  values: CourseFormValues;
  onChange: (values: CourseFormValues) => void;
  errors: CourseFormErrors;
  disabled?: boolean;
  onSubmit: () => void;
  actions?: React.ReactNode;
}) {
  const set = <K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) =>
    onChange({ ...values, [key]: value });
  const input = (key: keyof CourseFormValues, label: string, props = {}) => (
    <Field id={`course-${key}`} label={label} error={errors[key]}>
      <Input
        id={`course-${key}`}
        value={values[key]}
        onChange={(e) => set(key, e.target.value as never)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `course-${key}-error` : undefined}
        {...props}
      />
    </Field>
  );

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) onSubmit();
      }}
    >
      <fieldset disabled={disabled} className="flex flex-col gap-4">
        {input("title", "Title")}
        <div className="grid gap-4 sm:grid-cols-3">
          {input("provider", "Provider")}
          {input("category", "Category")}
          {input("level", "Level", { placeholder: "e.g. Beginner" })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {input("originalPrice", "Original price", { inputMode: "decimal", placeholder: "49.99" })}
          {input("discountedPrice", "Deal price", { inputMode: "decimal", placeholder: "29.99" })}
          {input("currency", "Currency", { maxLength: 3, placeholder: "GBP" })}
        </div>
        <Field
          id="course-externalUrl"
          label="Provider URL"
          error={errors.externalUrl}
          hint="Never shown publicly. Visitors reach it only through the approved outbound link."
        >
          <Input
            id="course-externalUrl"
            inputMode="url"
            placeholder="https://"
            value={values.externalUrl}
            onChange={(e) => set("externalUrl", e.target.value)}
            aria-invalid={Boolean(errors.externalUrl)}
            aria-describedby={errors.externalUrl ? "course-externalUrl-error" : undefined}
          />
        </Field>
        <Field
          id="course-expiresAt"
          label="Deal ends"
          error={errors.expiresAt}
          hint="Optional. Your local time; leave empty for no end date."
        >
          <Input
            id="course-expiresAt"
            type="datetime-local"
            value={values.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
            aria-invalid={Boolean(errors.expiresAt)}
          />
        </Field>
        <Field
          id="course-affiliate"
          label="Affiliate relationship"
          hint="Approval stays blocked while this is Not declared."
        >
          <select
            id="course-affiliate"
            className={`${selectClassName} sm:w-64`}
            value={values.affiliate}
            onChange={(e) => set("affiliate", e.target.value as AffiliateDeclaration)}
          >
            <option value="undeclared">Not declared</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        {values.affiliate === "yes" && (
          <Field
            id="course-affiliateDisclosure"
            label="Affiliate disclosure"
            error={errors.affiliateDisclosure}
            hint="Shown prominently on the public deal page."
          >
            <Textarea
              id="course-affiliateDisclosure"
              rows={3}
              value={values.affiliateDisclosure}
              onChange={(e) => set("affiliateDisclosure", e.target.value)}
              aria-invalid={Boolean(errors.affiliateDisclosure)}
              aria-describedby={
                errors.affiliateDisclosure ? "course-affiliateDisclosure-error" : undefined
              }
            />
          </Field>
        )}
      </fieldset>
      {actions && <div className="flex flex-wrap items-center gap-2 border-t pt-4">{actions}</div>}
    </form>
  );
}
