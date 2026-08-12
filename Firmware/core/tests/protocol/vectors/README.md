# Protocol V1 golden vectors

JSON fixtures under `v1/` are the single source of truth for CBOR envelope and
value round-trips. Languages that must consume them:

| Language | Consumer |
|---|---|
| TypeScript | `tools/sdk/typescript/test/vectors.test.ts` |
| Python | `tools/tests/test_protocol_vectors.py` |
| C | `tests/protocol` (`test_envelope_golden_vectors`) + `tests/fuzz` corpus decode; vectors remain the shared source of truth |

Do not fork per-language copies of these files.
