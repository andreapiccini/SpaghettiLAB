import type { CoreBindingRecord } from "@spaghettilab/domain";
import { getConnectionProfile } from "./connection-profile-store.js";

/** Resolves a binding's saved `ConnectionProfile` back into a real WebSocket URL — shared by every screen that offers a "Connetti"/"Riprova lettura" action on an existing Core Binding (never a fabricated address). */
export async function reconnectCoreBinding(binding: CoreBindingRecord, connect: (binding: CoreBindingRecord, wsUrl: string) => Promise<void>): Promise<void> {
  const profile = await getConnectionProfile(binding.connectionProfileId);
  if (!profile) return;
  const scheme = profile.transport === "websocket" ? "ws" : profile.transport;
  await connect(binding, `${scheme}://${profile.host}:${profile.port}`);
}
