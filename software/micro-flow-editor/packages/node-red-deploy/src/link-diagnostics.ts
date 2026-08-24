/**
 * "Fornisci runtime status del collegamento end-to-end e diagnostica dal
 * record source al command target" (S113 point 5). Pure in-memory
 * aggregation — no I/O, no wire calls; a caller feeds it events already
 * observed elsewhere (`@spaghettilab/node-red-nodes`'s `runRecordSource()`/
 * `runCommandTarget()` callbacks, `@spaghettilab/ota-lifecycle`-style
 * connection state). "Core offline, reconnect... non fermano i runtime
 * locali degli altri componenti" (S113 § Verifiche) holds structurally:
 * this tracker keeps one independent entry per `linkId`, so one link's
 * Core going offline never touches another link's entry.
 */
export type LinkDiagnostics = {
  readonly linkId: string;
  readonly sourceConnected: boolean;
  readonly targetConnected: boolean;
  readonly lastRecordAt?: number;
  readonly lastRecordSequence?: number;
  readonly lastCommandOutcome?: string;
  readonly lastCommandAt?: number;
  readonly recordCount: number;
  readonly commandCount: number;
  readonly duplicateRecordCount: number;
};

function emptyDiagnostics(linkId: string): LinkDiagnostics {
  return { linkId, sourceConnected: false, targetConnected: false, recordCount: 0, commandCount: 0, duplicateRecordCount: 0 };
}

export class LinkDiagnosticsTracker {
  private readonly byLink = new Map<string, LinkDiagnostics>();

  private get(linkId: string): LinkDiagnostics {
    return this.byLink.get(linkId) ?? emptyDiagnostics(linkId);
  }

  private set(linkId: string, next: LinkDiagnostics): void {
    this.byLink.set(linkId, next);
  }

  setSourceConnected(linkId: string, connected: boolean): void {
    this.set(linkId, { ...this.get(linkId), sourceConnected: connected });
  }

  setTargetConnected(linkId: string, connected: boolean): void {
    this.set(linkId, { ...this.get(linkId), targetConnected: connected });
  }

  recordReceived(linkId: string, sequence: number, at: number, duplicate: boolean): void {
    const current = this.get(linkId);
    this.set(linkId, {
      ...current,
      lastRecordAt: at,
      lastRecordSequence: sequence,
      recordCount: current.recordCount + (duplicate ? 0 : 1),
      duplicateRecordCount: current.duplicateRecordCount + (duplicate ? 1 : 0),
    });
  }

  commandRouted(linkId: string, outcome: string, at: number): void {
    const current = this.get(linkId);
    this.set(linkId, { ...current, lastCommandOutcome: outcome, lastCommandAt: at, commandCount: current.commandCount + 1 });
  }

  snapshot(linkId: string): LinkDiagnostics {
    return this.get(linkId);
  }

  allSnapshots(): readonly LinkDiagnostics[] {
    return [...this.byLink.values()];
  }
}
