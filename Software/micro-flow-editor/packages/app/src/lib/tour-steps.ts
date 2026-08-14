import type { LocaleId } from "./locale.js";

export type TourStep = {
  readonly target: string;
  readonly title: string;
  readonly body: string;
  /** Which side of the target the explanation card opens on — clamped to the viewport regardless. */
  readonly side: "right" | "bottom";
};

const IT: readonly TourStep[] = [
  { target: "rail-core-connections", title: "Core Connections", body: "Collega qui il tuo primo Core Spaghetti — via cavo USB o in rete. Da qui vedi lo stato di ogni Core del progetto.", side: "right" },
  { target: "rail-physical-composition", title: "Physical Composition", body: "Componi la struttura fisica del Core: Backbone, alimentazione, connettori, dispositivi esterni e Module.", side: "right" },
  { target: "rail-processing-graph", title: "Processing Graph", body: "Qui definisci la logica: Schedule ed Event source che partono, Block che elaborano, Rule che comandano.", side: "right" },
  { target: "rail-deploy-diff", title: "Deploy & Diff", body: "Prima di inviare le modifiche a un Core, qui vedi esattamente cosa cambia rispetto a quanto già installato.", side: "right" },
  { target: "rail-runtime-diagnostics", title: "Runtime & Diagnostics", body: "Telemetria, comandi e stato in tempo reale di ogni Core connesso — utile per capire cosa sta facendo davvero il dispositivo.", side: "right" },
  { target: "topbar-deploy", title: "Deploy", body: "Invia la configurazione corrente al Core selezionato, una volta che il Dry-run non segnala errori.", side: "bottom" },
  { target: "topbar-menu", title: "Menu", body: "Modalità base/avanzata e Impostazioni — locale, aspetto, credenziali, backup e altro — sono da qui.", side: "bottom" },
];

const EN: readonly TourStep[] = [
  { target: "rail-core-connections", title: "Core Connections", body: "Connect your first Spaghetti Core here — over USB or the network. This is also where you see every Core's status.", side: "right" },
  { target: "rail-physical-composition", title: "Physical Composition", body: "Compose the Core's physical structure: Backbone, power, connectors, external devices and Modules.", side: "right" },
  { target: "rail-processing-graph", title: "Processing Graph", body: "Define the logic here: Schedules and Event sources that fire, Blocks that process, Rules that command.", side: "right" },
  { target: "rail-deploy-diff", title: "Deploy & Diff", body: "Before pushing changes to a Core, see exactly what would change compared to what's already installed.", side: "right" },
  { target: "rail-runtime-diagnostics", title: "Runtime & Diagnostics", body: "Live telemetry, commands and status for every connected Core — the place to see what the device is actually doing.", side: "right" },
  { target: "topbar-deploy", title: "Deploy", body: "Sends the current configuration to the selected Core, once Dry-run reports no errors.", side: "bottom" },
  { target: "topbar-menu", title: "Menu", body: "Base/advanced mode and Settings — locale, appearance, credentials, backup and more — live here.", side: "bottom" },
];

export function tourSteps(locale: LocaleId): readonly TourStep[] {
  return locale === "en" ? EN : IT;
}
