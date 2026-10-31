import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";
import type { ResourceLink } from "@/types/resource";

export const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

/**
 * Plain-text block (UI-DEC-025 / UI-AC-032). React escapes the value, and
 * `whitespace-pre-wrap` keeps the author's line breaks. Content is never
 * interpreted as HTML or Markdown.
 */
export function PlainText({ text, className }: { text: string; className?: string }) {
  return <p className={cn("whitespace-pre-wrap break-words", className)}>{text}</p>;
}

/** True only for an absolute https URL with a host and no embedded credentials. */
export function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.length > 0 &&
      url.username === "" &&
      url.password === ""
    );
  } catch {
    return false;
  }
}

/**
 * Resource content link (UI-DEC-026 / UI-AC-033): a direct anchor to the
 * stored https URL, opened in a new tab without referrer or opener. Any other
 * value is shown as plain text and is never clickable.
 */
export function ResourceLinkItem({ link }: { link: ResourceLink }) {
  if (!isSafeHttpsUrl(link.url)) {
    return (
      <span className="text-sm text-muted-foreground">
        {link.label} <span className="break-all">({link.url})</span>
      </span>
    );
  }
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      {link.label}
      <ExternalLinkIcon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** Header shared by the public resource and course pages; links between the two catalogues. */
export function PublicContentHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
      <Link href="/" className="font-semibold">
        {APP_NAME}
      </Link>
      <nav aria-label="Discover" className="flex flex-wrap items-center gap-1 text-sm">
        <Link
          href="/resources"
          className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Learning Resources
        </Link>
        <Link
          href="/courses"
          className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Course Deals
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}

/**
 * Formats an exact decimal price string for display only. The value is never
 * used for arithmetic; an unknown currency code falls back to "49.00 XYZ".
 */
export function formatPrice(value: string, currency: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `${value} ${currency}`;
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/** Discounted price first; the original price is struck through and labelled for screen readers. */
export function CoursePrice({
  originalPrice,
  discountedPrice,
  currency,
  size = "default",
}: {
  originalPrice: string;
  discountedPrice: string;
  currency: string;
  size?: "default" | "large";
}) {
  const discounted = formatPrice(discountedPrice, currency);
  const original = formatPrice(originalPrice, currency);
  const reduced = discountedPrice !== originalPrice;
  return (
    <p className="flex flex-wrap items-baseline gap-2">
      <span className={cn("font-semibold", size === "large" ? "text-2xl" : "text-base")}>
        <span className="sr-only">Deal price: </span>
        {discounted}
      </span>
      {reduced && (
        <span className="text-sm text-muted-foreground">
          <span className="sr-only">Original price: </span>
          <s>{original}</s>
        </span>
      )}
      <span className="text-xs text-muted-foreground">{currency}</span>
    </p>
  );
}

/** "Affiliate" label for cards (UI-DEC-028). Shown only for a declared affiliate relationship. */
export function AffiliateBadge({ affiliated }: { affiliated: boolean | null }) {
  if (affiliated !== true) return null;
  return <Badge variant="secondary">Affiliate</Badge>;
}
