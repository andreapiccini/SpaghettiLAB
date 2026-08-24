# Telemetry retention boundary V1

Community owns live records, the bounded firmware delivery ring, MQTT/BLE consumers,
the bounded Studio buffer, explicit gap tracking and local export. No managed service
is needed to observe or export a personal project.

`@spaghettilab/telemetry-buffer` exposes optional `TelemetrySink` API V1 after writing
to the local buffer. Managed sinks may persist and aggregate immutable entries and
gaps. Sink failures are reported through a mandatory callback and never roll back or
interrupt the local Community buffer; delivery continues to later sinks.

Production owns durable retention, tenant isolation, multi-device aggregation,
historical queries, backups and storage operations. Those services consume the public
record model and must not import firmware implementation source.
