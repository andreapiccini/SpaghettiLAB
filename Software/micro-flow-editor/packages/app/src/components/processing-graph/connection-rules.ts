/**
 * Connection rules for the Device Processing Graph canvas.
 * Self-loops (a block's output into its own input, or the reverse) are
 * rejected at drag-connect time — they are also cycles in the domain model,
 * but the user should never be able to draw them.
 */
export function isValidProcessingConnection(connection: {
  readonly source?: string | null;
  readonly target?: string | null;
}): boolean {
  if (!connection.source || !connection.target) return false;
  return connection.source !== connection.target;
}
