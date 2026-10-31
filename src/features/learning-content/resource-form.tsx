"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isSafeHttpsUrl } from "@/features/learning-content/content-ui";
import {
  type AdminResource,
  type ResourceCreateInput,
  type ResourceUpdateInput,
  readResourceContent,
} from "@/types/resource";

// Limits mirror the accepted DTO (W7C-11 / D2 / E2): lengths are JavaScript
// string lengths (UTF-16 code units) after trimming. The server stays authoritative.
export const RESOURCE_LIMITS = {
  title: 200,
  category: 100,
  tag: 50,
  tags: 20,
  summary: 500,
  body: 20000,
  linkLabel: 120,
  linkUrl: 2048,
  links: 10,
} as const;

// biome-ignore lint/suspicious/noControlCharactersInRegex: the contract's forbidden control characters
const FORBIDDEN_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export interface ResourceLinkRow {
  /** Client-only row identity for React keys; never sent. */
  key: number;
  label: string;
  url: string;
}

export interface ResourceFormValues {
  title: string;
  category: string;
  /** Comma-separated in the form; split, trimmed and de-duplicated on submit. */
  tags: string;
  summary: string;
  body: string;
  links: ResourceLinkRow[];
  featured: boolean;
}

export type ResourceFormErrors = Partial<Record<string, string>>;

let nextLinkKey = 1;
export const newLinkRow = (label = "", url = ""): ResourceLinkRow => ({
  key: nextLinkKey++,
  label,
  url,
});

export const EMPTY_RESOURCE_FORM: ResourceFormValues = {
  title: "",
  category: "",
  tags: "",
  summary: "",
  body: "",
  links: [],
  featured: false,
};

export function resourceToFormValues(resource: AdminResource): ResourceFormValues {
  const content = readResourceContent(resource.content);
  return {
    title: resource.title,
    category: resource.category,
    tags: resource.tags.join(", "),
    summary: content.summary,
    body: content.body,
    links: content.links.map((link) => newLinkRow(link.label, link.url)),
    featured: resource.featured,
  };
}

/** Case-sensitive exact de-duplication, matching the server (E2). */
export function parseTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

function textError(value: string, max: number, required = true): string | undefined {
  const trimmed = value.trim();
  if (required && trimmed.length === 0) return "Required.";
  if (trimmed.length > max) return `At most ${max} characters.`;
  if (FORBIDDEN_CONTROL_CHARACTERS.test(trimmed)) return "Contains a character that isn't allowed.";
  return undefined;
}

export function validateResourceForm(values: ResourceFormValues): ResourceFormErrors {
  const errors: ResourceFormErrors = {
    title: textError(values.title, RESOURCE_LIMITS.title),
    category: textError(values.category, RESOURCE_LIMITS.category),
    summary: textError(values.summary, RESOURCE_LIMITS.summary),
    body: textError(values.body, RESOURCE_LIMITS.body),
  };
  const tags = parseTags(values.tags);
  if (tags.length > RESOURCE_LIMITS.tags) errors.tags = `At most ${RESOURCE_LIMITS.tags} tags.`;
  else {
    const bad = tags.find((tag) => textError(tag, RESOURCE_LIMITS.tag));
    if (bad) errors.tags = `Each tag must be at most ${RESOURCE_LIMITS.tag} characters.`;
  }
  if (values.links.length > RESOURCE_LIMITS.links) {
    errors.links = `At most ${RESOURCE_LIMITS.links} links.`;
  }
  for (const link of values.links) {
    const labelError = textError(link.label, RESOURCE_LIMITS.linkLabel);
    if (labelError) errors[`link-${link.key}-label`] = labelError;
    const url = link.url.trim();
    if (!url) errors[`link-${link.key}-url`] = "Required.";
    else if (url.length > RESOURCE_LIMITS.linkUrl || !isSafeHttpsUrl(url)) {
      errors[`link-${link.key}-url`] = "Must be a full https:// address without credentials.";
    }
  }
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as ResourceFormErrors;
}

function toContent(values: ResourceFormValues): ResourceCreateInput["content"] {
  const links = values.links.map((link) => ({ label: link.label.trim(), url: link.url.trim() }));
  return {
    summary: values.summary.trim(),
    body: values.body.trim(),
    ...(links.length > 0 ? { links } : {}),
  };
}

export function toResourceCreateInput(values: ResourceFormValues): ResourceCreateInput {
  return {
    title: values.title.trim(),
    category: values.category.trim(),
    tags: parseTags(values.tags),
    content: toContent(values),
    featured: values.featured,
  };
}

/**
 * PATCH body with only the fields that changed from the displayed record, so
 * untouched fields are never resent. Content is one stored object, so any
 * change to summary, body or links sends the whole content object.
 * Returns null when nothing changed.
 */
export function toResourceUpdateInput(
  initial: ResourceFormValues,
  values: ResourceFormValues,
  expectedStateVersion: number,
): ResourceUpdateInput | null {
  const next = toResourceCreateInput(values);
  const before = toResourceCreateInput(initial);
  const patch: Partial<ResourceCreateInput> = {};
  if (next.title !== before.title) patch.title = next.title;
  if (next.category !== before.category) patch.category = next.category;
  if (JSON.stringify(next.tags) !== JSON.stringify(before.tags)) patch.tags = next.tags;
  if (JSON.stringify(next.content) !== JSON.stringify(before.content)) patch.content = next.content;
  if (next.featured !== before.featured) patch.featured = next.featured;
  return Object.keys(patch).length === 0 ? null : { ...patch, expectedStateVersion };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function Counter({ value, max }: { value: string; max: number }) {
  const length = value.trim().length;
  return (
    <span className={length > max ? "text-destructive" : "text-muted-foreground"}>
      {length}/{max}
    </span>
  );
}

/**
 * Controlled field set for API-ADMRES-001 (create) and API-ADMRES-002 (edit).
 * The parent owns the values, so they survive a refetch after a 409
 * (UI-DEC-030). Status, publishedAt and stateVersion are never form fields.
 */
export function ResourceForm({
  values,
  onChange,
  errors,
  disabled,
  onSubmit,
  actions,
}: {
  values: ResourceFormValues;
  onChange: (values: ResourceFormValues) => void;
  errors: ResourceFormErrors;
  disabled?: boolean;
  onSubmit: () => void;
  actions: React.ReactNode;
}) {
  const set = <K extends keyof ResourceFormValues>(key: K, value: ResourceFormValues[K]) =>
    onChange({ ...values, [key]: value });
  const setLink = (key: number, patch: Partial<ResourceLinkRow>) =>
    set(
      "links",
      values.links.map((link) => (link.key === key ? { ...link, ...patch } : link)),
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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <Label htmlFor="resource-title">Title</Label>
            <Counter value={values.title} max={RESOURCE_LIMITS.title} />
          </div>
          <Input
            id="resource-title"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "resource-title-error" : undefined}
          />
          <FieldError id="resource-title-error" message={errors.title} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resource-category">Category</Label>
            <Input
              id="resource-category"
              placeholder="e.g. Network security"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? "resource-category-error" : undefined}
            />
            <FieldError id="resource-category-error" message={errors.category} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resource-tags">Tags</Label>
            <Input
              id="resource-tags"
              placeholder="Comma-separated, e.g. SOC, Beginner"
              value={values.tags}
              onChange={(e) => set("tags", e.target.value)}
              aria-invalid={Boolean(errors.tags)}
              aria-describedby={errors.tags ? "resource-tags-error" : "resource-tags-hint"}
            />
            {errors.tags ? (
              <FieldError id="resource-tags-error" message={errors.tags} />
            ) : (
              <p id="resource-tags-hint" className="text-xs text-muted-foreground">
                Up to {RESOURCE_LIMITS.tags} tags. Duplicates are removed.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <Label htmlFor="resource-summary">Summary</Label>
            <Counter value={values.summary} max={RESOURCE_LIMITS.summary} />
          </div>
          <Textarea
            id="resource-summary"
            rows={3}
            value={values.summary}
            onChange={(e) => set("summary", e.target.value)}
            aria-invalid={Boolean(errors.summary)}
            aria-describedby={errors.summary ? "resource-summary-error" : undefined}
          />
          <FieldError id="resource-summary-error" message={errors.summary} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <Label htmlFor="resource-body">Body</Label>
            <Counter value={values.body} max={RESOURCE_LIMITS.body} />
          </div>
          <Textarea
            id="resource-body"
            rows={10}
            value={values.body}
            onChange={(e) => set("body", e.target.value)}
            aria-invalid={Boolean(errors.body)}
            aria-describedby={errors.body ? "resource-body-error" : "resource-body-hint"}
          />
          {errors.body ? (
            <FieldError id="resource-body-error" message={errors.body} />
          ) : (
            <p id="resource-body-hint" className="text-xs text-muted-foreground">
              Plain text. Line breaks are kept; HTML and Markdown are shown as typed.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Links</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={values.links.length >= RESOURCE_LIMITS.links}
              onClick={() => set("links", [...values.links, newLinkRow()])}
            >
              <PlusIcon />
              Add link
            </Button>
          </div>
          {values.links.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Optional. Up to {RESOURCE_LIMITS.links} https links.
            </p>
          )}
          <FieldError id="resource-links-error" message={errors.links} />
          {values.links.map((link, index) => (
            <div
              key={link.key}
              className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_2fr_auto]"
            >
              <div className="flex flex-col gap-1">
                <Label htmlFor={`link-${link.key}-label`} className="text-xs">
                  Link {index + 1} label
                </Label>
                <Input
                  id={`link-${link.key}-label`}
                  value={link.label}
                  onChange={(e) => setLink(link.key, { label: e.target.value })}
                  aria-invalid={Boolean(errors[`link-${link.key}-label`])}
                />
                <FieldError
                  id={`link-${link.key}-label-error`}
                  message={errors[`link-${link.key}-label`]}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`link-${link.key}-url`} className="text-xs">
                  Link {index + 1} URL
                </Label>
                <Input
                  id={`link-${link.key}-url`}
                  inputMode="url"
                  placeholder="https://"
                  value={link.url}
                  onChange={(e) => setLink(link.key, { url: e.target.value })}
                  aria-invalid={Boolean(errors[`link-${link.key}-url`])}
                />
                <FieldError
                  id={`link-${link.key}-url-error`}
                  message={errors[`link-${link.key}-url`]}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-end"
                aria-label={`Remove link ${index + 1}`}
                onClick={() =>
                  set(
                    "links",
                    values.links.filter((row) => row.key !== link.key),
                  )
                }
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>

        <label htmlFor="resource-featured" className="flex w-fit items-center gap-2 text-sm">
          <Checkbox
            id="resource-featured"
            checked={values.featured}
            onCheckedChange={(checked) => set("featured", checked === true)}
          />
          Featured resource
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">{actions}</div>
    </form>
  );
}
