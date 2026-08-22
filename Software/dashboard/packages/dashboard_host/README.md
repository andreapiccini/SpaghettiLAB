# dashboard_host

Adapter Protocol V1 e EdgeHost **sotto** `HostPort`. Le schermate Flutter non
importano questo package (solo `main.dart` per il wiring).

- `ProtocolV1Adapter` — record decodificati → `ExposurePoint` (D110)
- `MqttCoreTransport` — MQTT Protocol V1 (`modules/+/records`, `requests/<client>`)
- `LoopbackMqttBroker` + `SimulatedCore` — Core in-process (default **Core live**)
- `NetworkMqttBroker` — TCP `mqtt://` (dart:io) o WebSocket `ws://` (Flutter web)
- `EdgeHost` — `HostPort` live su MQTT; layout/pack restano su FakeHost interno
- `CloudHost` — `HostPort` su HOST_API JSON (`https://…/v1` o `cloud://loopback`)
- `CompositeHost` — Casa demo + Core live + Core MQTT/cloud aggiunti
- Store pack: `installStorePack` verifica Ed25519 (D250)
- Identità: `login` / `GET /v1/me` (E050); utenti site (E051); Support Grant (E080); JWT HTTP Bearer su CloudHost

Indirizzo MQTT: `mqtt://127.0.0.1:1883/<base>/v1/cores/<id>` oppure
`ws://127.0.0.1:9001/v1/cores/<id>`. Sul web `mqtt://` viene riscritto su
WebSocket porta 9001 (`make broker`).

Indirizzo cloud: `https://host.example/v1` (poll HTTP, JWT opzionale dopo login) oppure
`cloud://loopback` per lo stesso JSON in-process.

I RECORD firmware V1 non portano i valori campo (CBOR 0–3). L’host accetta in
più la chiave 4 `{fieldId: value}` per aggiornare le gauge; senza di essa i
comandi partono comunque, i numeri restano all’ultimo valore noto.

Niente MQTT/CBOR nelle schermate Flutter. Niente automazioni.
