import type { ConsultingService, ConsultingStatus } from "@/types/consulting";

/** Single source of truth for human-facing service names (SRS FR-BIZ-015..021). */
export const CONSULTING_SERVICE_LABELS: Record<ConsultingService, string> = {
  WEBSITE_ASSESSMENT: "Website Security Assessment",
  NETWORK_ASSESSMENT: "Network Security Assessment",
  VULNERABILITY_ASSESSMENT: "Vulnerability Assessment",
  PHISHING_AWARENESS: "Phishing & Security Awareness",
  CLOUD_REVIEW: "Cloud Security Review",
  CYBER_RISK_ASSESSMENT: "Cybersecurity Risk Assessment",
  SECURITY_DOCUMENTATION: "Security Documentation",
};

/** Short, non-promissory descriptions of what each approved service covers. */
export const CONSULTING_SERVICE_DESCRIPTIONS: Record<ConsultingService, string> = {
  WEBSITE_ASSESSMENT: "A security review of a website or web application you operate.",
  NETWORK_ASSESSMENT: "A review of how your network is exposed, segmented and protected.",
  VULNERABILITY_ASSESSMENT: "Identification of known weaknesses in systems you authorise.",
  PHISHING_AWARENESS: "Support to help your people recognise and report phishing.",
  CLOUD_REVIEW: "A review of the security configuration of your cloud environment.",
  CYBER_RISK_ASSESSMENT: "A structured look at your organisation's cybersecurity risks.",
  SECURITY_DOCUMENTATION: "Policies, procedures and improvement guidance for your team.",
};

export function isConsultingService(value: unknown): value is ConsultingService {
  return typeof value === "string" && value in CONSULTING_SERVICE_LABELS;
}

export const CONSULTING_STATUS_LABELS: Record<ConsultingStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

/** What each WF-REQ state means to the owning Business. */
export const CONSULTING_STATUS_BUSINESS_MEANING: Record<ConsultingStatus, string> = {
  SUBMITTED: "Your request has been received and is waiting for review.",
  UNDER_REVIEW: "The consulting team is reviewing your request.",
  ACCEPTED:
    "Your request has been accepted. Technical work still needs a current scope authorisation from you.",
  DECLINED: "This request was not taken forward. No further action will happen on it.",
  IN_PROGRESS: "Delivery is under way within the scope you authorised.",
  COMPLETED: "Delivery for this request has been completed.",
};

/** What each WF-REQ state means to Consultant/Admin operators. */
export const CONSULTING_STATUS_OPERATIONAL_MEANING: Record<ConsultingStatus, string> = {
  SUBMITTED: "New request. Start the review when you are ready to assess it.",
  UNDER_REVIEW: "Decide whether to accept or decline this request.",
  ACCEPTED: "Accepted. Delivery can start only with a current explicit scope authorisation.",
  DECLINED: "Declined. This is a terminal state.",
  IN_PROGRESS: "Delivery is in progress. Complete it once linked work is finished.",
  COMPLETED: "Completed. This is a terminal state.",
};

/** Known keys written by this client's intake form; anything else is humanised. */
const RECORD_FIELD_LABELS: Record<string, string> = {
  companyName: "Company name",
  name: "Name",
  email: "Email",
  phone: "Phone",
  role: "Role",
  websiteOrDomain: "Website or domain",
  summary: "Context",
};

export function recordFieldLabel(key: string): string {
  if (RECORD_FIELD_LABELS[key]) return RECORD_FIELD_LABELS[key];
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** The company name a Business entered, if the JSON snapshot carries one as text. */
export function companyNameOf(companyDetails: Record<string, unknown> | null | undefined) {
  const value = companyDetails?.companyName ?? companyDetails?.name;
  return typeof value === "string" && value.trim() ? value : null;
}

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export function formatConsultingDateTime(value: string | null | undefined): string | null {
  return value ? dateTimeFormat.format(new Date(value)) : null;
}

export function formatConsultingDate(value: string | null | undefined): string | null {
  return value ? dateFormat.format(new Date(value)) : null;
}

/** A short, non-secret reference so operators can tell requests apart. */
export function shortReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/**
 * Renders a scope JSON container as readable lines. Arrays of text (the
 * shape this client writes) map one-to-one; anything else is shown as
 * `key: value` text rather than silently dropped.
 */
export function scopeEntries(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(
      ([key, item]) => `${key}: ${typeof item === "string" ? item : JSON.stringify(item)}`,
    );
  }
  return [];
}

/** Only plain-text arrays can safely seed an editable replacement version. */
export function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((item) => typeof item === "string") ? (value as string[]) : null;
}
