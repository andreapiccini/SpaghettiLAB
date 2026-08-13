import type { SessionState, SyncRelationship } from "@spaghettilab/core-session";
import { CircleCheck, GitFork, PenLine, RotateCw, TriangleAlert, type LucideIcon } from "lucide-react";

/** `ux/screens/S030-core-connections/visual.md` § Badge stato sessione — color + whether the dot pulses (transitional states only). */
export function sessionBadgeStyle(state: SessionState): { readonly colorVar: string; readonly pulsing: boolean; readonly label: string } {
  switch (state) {
    case "DISCONNECTED":
      return { colorVar: "var(--color-ink-faint)", pulsing: false, label: "DISCONNECTED" };
    case "CONNECTING":
    case "AUTHENTICATING":
    case "SYNCHRONIZING":
      return { colorVar: "var(--color-info)", pulsing: true, label: state };
    case "READY":
      return { colorVar: "var(--color-success)", pulsing: false, label: "READY" };
    case "VALIDATING":
    case "APPLYING":
    case "UPDATING":
    case "REBOOTING":
    case "TRIAL":
      return { colorVar: "var(--color-warning)", pulsing: true, label: state };
    case "CONFLICT":
    case "ERROR":
    case "ROLLED_BACK":
      return { colorVar: "var(--color-error)", pulsing: false, label: state };
    default:
      return { colorVar: "var(--color-ink-faint)", pulsing: false, label: state };
  }
}

/** `ux/screens/S030-core-connections/visual.md` § Badge relazione progetto/dispositivo. */
export function syncBadge(relationship: SyncRelationship): { readonly icon: LucideIcon; readonly colorVar: string; readonly label: string } {
  switch (relationship) {
    case "IN_SYNC":
      return { icon: CircleCheck, colorVar: "var(--color-success)", label: "IN_SYNC" };
    case "PROJECT_DIRTY":
      return { icon: PenLine, colorVar: "var(--color-warning)", label: "modifiche locali non ancora inviate" };
    case "DEVICE_CHANGED":
      return { icon: RotateCw, colorVar: "var(--color-info)", label: "il dispositivo ha uno stato diverso dall'ultimo deploy" };
    case "DIVERGED":
      return { icon: GitFork, colorVar: "var(--color-error)", label: "progetto e dispositivo sono cambiati entrambi" };
    case "INCOMPATIBLE":
      return { icon: TriangleAlert, colorVar: "var(--color-error)", label: "catalogo/profilo non compatibile con questo progetto" };
  }
}

/**
 * `ux/screens/S030-core-connections/ui-behavior.md` § Azione per riga secondo lo stato.
 * `hasError` is not in that table: it covers a case the table doesn't model — a
 * `connect()` attempt that failed before a `CoreSession` ever reached `READY`
 * (e.g. the WebSocket itself refused), so there is no session-state transition to
 * `ERROR` to key off of. Without this, a failed attempt looked identical to "never
 * tried" — a real bug found wiring this screen up live.
 */
export function rowActionLabel(state: SessionState, stale: boolean, relationship: SyncRelationship | null, hasError = false): string | null {
  if (state === "DISCONNECTED" && hasError) return "Rivedi errore";
  if (state === "DISCONNECTED") return stale ? "Riconnetti" : "Connetti";
  if (state === "CONNECTING" || state === "AUTHENTICATING" || state === "SYNCHRONIZING") return "Annulla";
  if (state === "READY") {
    switch (relationship) {
      case "PROJECT_DIRTY":
        return "Invia al Core";
      case "DEVICE_CHANGED":
        return "Rivedi modifiche";
      case "DIVERGED":
        return "Confronta e riconcilia";
      case "INCOMPATIBLE":
        return "Dettagli incompatibilità";
      default:
        return null;
    }
  }
  if (state === "CONFLICT" || state === "ERROR") return "Rivedi errore";
  if (state === "ROLLED_BACK") return "Vedi cosa è cambiato";
  return null;
}
