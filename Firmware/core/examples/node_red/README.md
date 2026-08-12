# Node-RED Spaghetti Protocol V1 example

Import `spaghetti_v1_flow.json` into Node-RED. Configure only the MQTT broker host
and the Core `core_id` (canonical lowercase hex of the device identity). The flow
contains **no** broker passwords, PSKs, or certificates.

## Topic layout

All topics are under `<base>/v1/cores/<core_id>/`:

| Topic | Role |
|---|---|
| `state` | Retained device status events |
| `catalog` | Retained catalog fingerprint / placeholder |
| `modules/+/records` | Per-module record events |
| `discovery` | Discovery candidate events |
| `requests/<client_id>` | Host → Core Protocol V1 requests |
| `responses/<client_id>` | Correlated Protocol V1 responses |

Payloads are Protocol V1 CBOR envelopes. The flow decodes CBOR into JavaScript
objects for debug/dashboard use.

## Config Coordinator

Module nodes emit desired Config fragments only. A single **Config Coordinator**:

1. `GET_CONFIG` for the current snapshot and generation
2. merges fragments into a candidate
3. `VALIDATE_CONFIG`
4. `APPLY_CONFIG` with compare-and-swap on the generation

On `CONFLICT`, the coordinator re-reads Config and retries the merge. It never
forces a stale snapshot. Catalog fingerprints are cached and invalidated when the
retained catalog event changes.

## Client ID

Set `client_id` to a stable Node-RED instance name (max 32 characters,
`[A-Za-z0-9._-]`). Responses are published to `responses/<client_id>`.
