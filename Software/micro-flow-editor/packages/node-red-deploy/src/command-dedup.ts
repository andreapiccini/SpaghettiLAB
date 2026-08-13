/**
 * "Gestisci... command result e retry senza duplicare azioni" (S113 point
 * 3) / "un record duplicato/retry non duplica il comando corrispondente"
 * (S113 § Verifiche). A record can arrive twice for reasons entirely
 * outside this package's control — a transport-level retry, an MQTT
 * at-least-once redelivery, a reconnect replaying a small backlog — and
 * each duplicate must never re-trigger the coordinator's command. Keyed by
 * `(linkId, sourceKey, sequence)`, since the same `(sourceKey, sequence)`
 * pair is only meaningful within one link's source Core/boot epoch — two
 * different links watching the same field are legitimately independent
 * deduplication scopes.
 */
export class CommandDedupeTracker {
  private readonly seen = new Map<string, number>();
  private readonly capacity: number;

  constructor(capacity = 1000) {
    this.capacity = capacity;
  }

  private key(linkId: string, sourceKey: number, sequence: number): string {
    return `${linkId}:${sourceKey}:${sequence}`;
  }

  /** `true` the first time this `(linkId, sourceKey, sequence)` is seen (caller should proceed and route the command); `false` on every later duplicate (caller must skip). */
  shouldRoute(linkId: string, sourceKey: number, sequence: number): boolean {
    const key = this.key(linkId, sourceKey, sequence);
    if (this.seen.has(key)) return false;
    if (this.seen.size >= this.capacity) {
      const oldest = this.seen.keys().next().value;
      if (oldest !== undefined) this.seen.delete(oldest);
    }
    this.seen.set(key, Date.now());
    return true;
  }

  get size(): number {
    return this.seen.size;
  }
}
