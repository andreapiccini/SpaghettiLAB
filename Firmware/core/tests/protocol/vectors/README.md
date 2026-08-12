# Protocol V1 golden vectors

JSON fixtures under `v1/` are the single source of truth for CBOR envelope and
value round-trips. Languages that must consume them:

| Language | Consumer |
|---|---|
| TypeScript | `tools/sdk/typescript/test/vectors.test.ts` |
| Python | `tools/tests/test_protocol_vectors.py` |
| C | Planned in phase 380 (`spaghetti` CLI / host codec tests). Firmware already pins the GET_STATUS request bytes in `tests/protocol/src/main.c` (`test_envelope_golden_vectors`); that vector is asserted identical here by the Python suite. |

Do not fork per-language copies of these files.
