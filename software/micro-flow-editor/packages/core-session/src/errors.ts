/** Error codes owned by this package — see `@spaghettilab/domain`'s `DomainErrorCode` comment on why each package keeps its own namespace instead of a shared global enum. */
export const CoreSessionErrorCode = {
  DEVICE_ID_MISMATCH: "core-session.sync.device_id_mismatch",
  RECONCILE_NOT_IMPLEMENTED: "core-session.reconcile.not_implemented",
} as const;

export type CoreSessionErrorCodeValue = (typeof CoreSessionErrorCode)[keyof typeof CoreSessionErrorCode];

export class CoreSessionError extends Error {
  readonly code: CoreSessionErrorCodeValue;

  constructor(code: CoreSessionErrorCodeValue, message: string) {
    super(message);
    this.name = "CoreSessionError";
    this.code = code;
  }
}
