/**
 * D6D-1 report editor authoring profile (API Contract v1.5 §1.6).
 *
 * The backend accepts any JSON object as draftContent; this editor authors
 * only three optional plain-text properties. Existing content is never
 * silently dropped: unknown keys are carried through unchanged on save, and
 * content the editor cannot represent safely blocks editing instead of being
 * overwritten.
 */

export const NARRATIVE_FIELDS = [
  {
    key: "executiveSummary",
    label: "Executive summary",
    help: "A plain-language overview of what the assessment found and why it matters.",
  },
  {
    key: "scope",
    label: "Scope",
    help: "What was assessed, within the authorised scope.",
  },
  {
    key: "remediationPlan",
    label: "Remediation plan",
    help: "The recommended order and approach for fixing the included findings.",
  },
] as const;

export type NarrativeKey = (typeof NARRATIVE_FIELDS)[number]["key"];
export type NarrativeValues = Record<NarrativeKey, string>;

const NARRATIVE_KEYS = NARRATIVE_FIELDS.map((field) => field.key) as NarrativeKey[];

export const EMPTY_NARRATIVE: NarrativeValues = {
  executiveSummary: "",
  scope: "",
  remediationPlan: "",
};

export interface DraftAnalysis {
  /** The stored object (or an empty object when the stored value is not one). */
  original: Record<string, unknown>;
  values: NarrativeValues;
  /** Keys this editor does not author; preserved unchanged on save. */
  unknownKeys: string[];
  /** Why editing must be blocked, when the content can't be preserved safely. */
  blockReason: string | null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function analyseDraftContent(content: unknown): DraftAnalysis {
  if (!isPlainObject(content)) {
    return {
      original: {},
      values: { ...EMPTY_NARRATIVE },
      unknownKeys: [],
      blockReason:
        "This report's content isn't in a format the editor can safely update, so editing is disabled to avoid losing it.",
    };
  }
  const values = { ...EMPTY_NARRATIVE };
  const incompatible: string[] = [];
  for (const field of NARRATIVE_FIELDS) {
    const value = content[field.key];
    if (value === undefined || value === null) continue;
    if (typeof value === "string") values[field.key] = value;
    else incompatible.push(field.label);
  }
  return {
    original: content,
    values,
    unknownKeys: Object.keys(content).filter(
      (key) => !NARRATIVE_KEYS.includes(key as NarrativeKey),
    ),
    blockReason:
      incompatible.length > 0
        ? `${incompatible.join(", ")} ${incompatible.length > 1 ? "hold" : "holds"} existing data that isn't plain text, so editing is disabled to avoid overwriting it.`
        : null,
  };
}

/**
 * Merges the edited narrative into the stored object. Unknown keys are kept
 * exactly as they were; an emptied narrative field is omitted.
 */
export function buildDraftContent(
  original: Record<string, unknown>,
  values: NarrativeValues,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...original };
  for (const key of NARRATIVE_KEYS) {
    if (values[key].trim()) next[key] = values[key];
    // A legacy null is preserved as stored; only editor-authored text is omitted when emptied.
    else if (original[key] !== null) delete next[key];
  }
  return next;
}

/** Frontend submit rule: at least one narrative field with non-whitespace text. */
export function hasNarrativeText(values: NarrativeValues): boolean {
  return NARRATIVE_KEYS.some((key) => values[key].trim().length > 0);
}

export function narrativeEquals(a: NarrativeValues, b: NarrativeValues): boolean {
  return NARRATIVE_KEYS.every((key) => a[key] === b[key]);
}

/** Read-only rendering of preserved content as plain text (never HTML). */
export function preservedValueText(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}
