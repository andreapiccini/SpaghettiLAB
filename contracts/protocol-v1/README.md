# Protocol V1 canonical contract

This directory is the language-neutral source of truth for the stable Protocol V1
identifier space and golden CBOR vectors.

- `manifest.json` owns protocol version, envelope keys, operation IDs, statuses,
  event IDs, resource profiles, capability bits and capability response keys.
- `vectors/v1/` owns cross-language golden CBOR fixtures.
- `verify_contract.py` checks the C firmware header, TypeScript SDK and Python host
  tool against the manifest.

The C, TypeScript, Python and Dart implementations remain independently buildable.
They do not import each other's source files.

## Compatibility policy

Protocol V1 is append-only:

1. existing numeric identifiers never change meaning;
2. existing identifiers are never reused;
3. new operations and events receive a value above the current maximum;
4. compatible response fields are appended and older consumers ignore only fields
   explicitly documented as optional;
5. a breaking envelope or identifier change requires Protocol V2;
6. every contract change updates the manifest, implementations, fixtures and tests in
   the same Community commit.

Clients negotiate build capabilities at runtime and degrade gracefully when a bit
is absent. Private extensions therefore remain additive and are never prerequisites
for building or using the Community implementation.

Run the language-neutral gate from the repository root:

```sh
python contracts/protocol-v1/verify_contract.py
```
