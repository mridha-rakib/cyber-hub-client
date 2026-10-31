/**
 * Frontend-owned Learning Resource contract types, hand-derived from the
 * accepted Wave 7C backend (`api/src/modules/resources`, API Contract v1.7
 * `ResourceView` / `ResourceAdminView` / `ResourceWriteInput`). Not generated
 * and not imported cross-repo: keep in sync by hand.
 */

export type ResourceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export const RESOURCE_STATUS_LABELS: Record<ResourceStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export interface ResourceLink {
  label: string;
  url: string;
}

/** Plain-text content (UI-DEC-025): never HTML or Markdown. */
export interface ResourceContent {
  summary: string;
  body: string;
  links?: ResourceLink[];
}

/** API-RES-001/002 public projection: PUBLISHED rows only, no status or version. */
export interface PublicResource {
  id: string;
  title: string;
  category: string;
  tags: string[];
  /** Typed `unknown` on the wire; read it through `readResourceContent`. */
  content: unknown;
  featured: boolean;
  publishedAt: string | null;
}

/** API-ADMRES-006/007 Admin management projection. */
export interface AdminResource extends PublicResource {
  status: ResourceStatus;
  stateVersion: number;
  createdAt: string;
  updatedAt: string;
}

/** API-ADMRES-001 body. Status, publishedAt, stateVersion and timestamps are server-owned. */
export interface ResourceCreateInput {
  title: string;
  category: string;
  tags: string[];
  content: ResourceContent;
  featured?: boolean;
}

/** API-ADMRES-002 body: any changed subset plus the displayed version. */
export type ResourceUpdateInput = Partial<ResourceCreateInput> & {
  expectedStateVersion: number;
};

/**
 * Defensive reader for the stored content object. Anything that is not the
 * documented shape degrades to empty text rather than throwing or rendering
 * an unexpected value.
 */
export function readResourceContent(content: unknown): Required<ResourceContent> {
  const record =
    typeof content === "object" && content !== null ? (content as Record<string, unknown>) : {};
  const links = Array.isArray(record.links)
    ? record.links.flatMap((link) => {
        if (typeof link !== "object" || link === null) return [];
        const { label, url } = link as Record<string, unknown>;
        return typeof label === "string" && typeof url === "string" ? [{ label, url }] : [];
      })
    : [];
  return {
    summary: typeof record.summary === "string" ? record.summary : "",
    body: typeof record.body === "string" ? record.body : "",
    links,
  };
}
