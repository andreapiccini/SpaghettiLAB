import type { ProcessingCatalogCategory, ProcessingCatalogCategoryId } from "./types.js";

export const PROCESSING_CATALOG_CATEGORIES: readonly ProcessingCatalogCategory[] = [
  { id: "system", label: "Sistema", color: "#64748B" },
  { id: "trigger", label: "Trigger", color: "#7C5CFC" },
  { id: "variables", label: "Variabili", color: "#7C5CFC" },
  { id: "logic", label: "Logica e flusso", color: "#B36B00" },
  { id: "math", label: "Matematica", color: "#0EA5A0" },
  { id: "filter", label: "Filtri", color: "#0EA5A0" },
  { id: "time", label: "Tempo", color: "#7C5CFC" },
  { id: "io", label: "Ingressi e I/O", color: "#3F77DA" },
  { id: "strings", label: "Stringhe", color: "#0EA5A0" },
  { id: "display", label: "Display", color: "#8A8F99" },
  { id: "sound", label: "Suono e LED", color: "#8A8F99" },
  { id: "storage", label: "Dati e storage", color: "#0EA5A0" },
  { id: "serial", label: "Seriale e SMS", color: "#3F77DA" },
  { id: "network", label: "Rete", color: "#1F9D55" },
  { id: "cloud", label: "Cloud", color: "#1F9D55" },
  { id: "modbus", label: "Modbus", color: "#B36B00" },
];

export function catalogCategory(id: ProcessingCatalogCategoryId): ProcessingCatalogCategory {
  const found = PROCESSING_CATALOG_CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`unknown processing catalog category: ${id}`);
  return found;
}
