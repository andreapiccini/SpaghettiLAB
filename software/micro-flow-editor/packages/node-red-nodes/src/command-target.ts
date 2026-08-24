import { runCommand, type CommandOutcome, type CommandWireClient, type RunCommandRequest } from "@spaghettilab/core-actions";
import type { PermissionSet } from "@spaghettilab/domain";

/**
 * The `command target` node's execution — a thin re-export of
 * `@spaghettilab/core-actions`'s real `runCommand()` (S092), not a
 * reimplementation. S112 § Verifiche's "i nodi Node-RED e l'applicazione
 * React Flow usano la stessa decodifica/validazione Protocol V1, non due
 * implementazioni parallele" holds for command execution specifically
 * because this function *is* the app's own permission-denied/queue-full/
 * timeout classification, called directly, not mirrored.
 */
export function runCommandTarget(client: CommandWireClient, granted: PermissionSet, req: RunCommandRequest): Promise<CommandOutcome> {
  return runCommand(client, granted, req);
}
