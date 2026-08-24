import type { LocaleId } from "./locale.js";

const IT: Record<string, string> = {
  "rail-core-connections": "Inizia da qui: collega un Core",
  "rail-physical-composition": "Ora componi la struttura fisica",
  "rail-processing-graph": "Ora definisci la logica",
};

const EN: Record<string, string> = {
  "rail-core-connections": "Start here: connect a Core",
  "rail-physical-composition": "Now compose the physical structure",
  "rail-processing-graph": "Now define the logic",
};

export function nextStepLabel(target: string, locale: LocaleId): string {
  const copy = locale === "en" ? EN : IT;
  return copy[target] ?? target;
}
