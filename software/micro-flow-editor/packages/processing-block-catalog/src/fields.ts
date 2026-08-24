import type { CatalogField } from "./types.js";

export function defaultPropertiesFromFields(fields: readonly CatalogField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.default === undefined) continue;
    if (field.type === "number" && typeof field.default === "number") {
      out[field.id] = BigInt(Math.trunc(field.default));
    } else {
      out[field.id] = field.default;
    }
  }
  return out;
}

export function formatFieldsSubtitle(fields: readonly CatalogField[], properties: Readonly<Record<string, unknown>>): string | undefined {
  const parts: string[] = [];
  for (const field of fields) {
    const raw = properties[field.id];
    const text = valueText(raw);
    if (text === undefined) continue;
    if (field.type === "select") {
      const option = field.options?.find((o) => o.value === text);
      parts.push(option?.label ?? text);
    } else if (field.type === "checkbox") {
      if (raw === true || text === "true") parts.push(field.label);
    } else {
      parts.push(text);
    }
  }
  if (parts.length === 0) return undefined;
  return parts.join(" · ");
}

function valueText(value: unknown): string | undefined {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return undefined;
}
