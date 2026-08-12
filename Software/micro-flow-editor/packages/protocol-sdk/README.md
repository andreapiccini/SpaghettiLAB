# @spaghettilab/protocol-sdk

CBOR codec for the firmware's Communication Protocol V1 (S021). Implements the
4-field envelope (`envelope.ts`), all 27 operations (`operations/`), the 4 event
payloads (`events.ts`), and the lossless 64-bit JSON rule (`int64.ts`), on top of a
hand-written canonical CBOR primitive layer (`cbor.ts`) matching exactly the subset
the firmware's zcbor encoder uses.

See `../../../roadmap/react-flow-v1/tasks/S021-codec-protocol-types.md` for the
implementation note. Two things worth knowing:

- The envelope now has a **real golden vector**, added to
  `Firmware/core/tests/protocol/src/main.c` and verified by actually building and
  running that suite in `native_sim` — not just read from source. That run caught a
  real bug: this firmware's zcbor build encodes maps/arrays as **indefinite-length**
  (`0xBF...0xFF` / `0x9F...0xFF`), not canonical/definite-length as initially assumed
  from reading the C source alone. `cbor.ts` matches that now; the decoder accepts
  both forms.
- The 27 operations' payloads are still tested against **spec-conformant fixtures
  written for this package**, not firmware-published vectors — extending real golden
  vectors to each operation would mean wiring every handler into the firmware test,
  out of scope for this pass.

`SpaghettiClient`, transports and event streaming are implemented by S022–S024, not
yet started.
