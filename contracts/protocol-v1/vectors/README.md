# Protocol V1 golden vectors

JSON fixtures under `v1/` are the canonical cross-language CBOR envelope and
value round-trips. Languages that must consume them:

| Language | Consumer |
|---|---|
| TypeScript | `firmware/core/tools/sdk/typescript/test/vectors.test.ts` |
| Python | `firmware/core/tools/tests/test_protocol_vectors.py` |
| C | `firmware/core/tests/protocol` (`test_envelope_golden_vectors`) + fuzz corpus decode |

Do not fork per-language copies of these files.
