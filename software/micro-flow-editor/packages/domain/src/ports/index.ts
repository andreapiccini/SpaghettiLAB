export type { Clock } from "./clock.js";
export type { UuidGenerator } from "./uuid.js";
export type { Storage } from "./storage.js";
export type { CredentialStore } from "./credentials.js";
export type { Logger } from "./logger.js";
export type { AuditEntry, AuditLog } from "./audit.js";

export { FakeClock } from "./fakes/fake-clock.js";
export { FakeUuidGenerator } from "./fakes/fake-uuid.js";
export { InMemoryStorage } from "./fakes/in-memory-storage.js";
export { InMemoryCredentialStore } from "./fakes/in-memory-credential-store.js";
export { RecordingLogger } from "./fakes/recording-logger.js";
export { InMemoryAuditLog } from "./fakes/in-memory-audit-log.js";
