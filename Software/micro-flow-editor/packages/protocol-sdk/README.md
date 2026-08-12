# @spaghettilab/protocol-sdk

CBOR codec for the firmware's Communication Protocol V1 (S021). Implements the
4-field envelope (`envelope.ts`), all 27 operations (`operations/`), the 4 event
payloads (`events.ts`), and the lossless 64-bit JSON rule (`int64.ts`), on top of a
hand-written canonical CBOR primitive layer (`cbor.ts`) matching exactly the subset
the firmware's zcbor encoder uses.

See `../../../roadmap/react-flow-v1/tasks/S021-codec-protocol-types.md` for the
implementation note — in particular, the firmware does not publish golden byte
vectors, so this package's tests use spec-conformant fixtures derived from reading
the firmware source, not firmware-provided reference bytes; that gap is documented
there, not hidden.

`SpaghettiClient`, transports and event streaming are implemented by S022–S024, not
yet started.
