# Fase 150 — CBOR

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Decodificare un payload CBOR V0 rigoroso nel modello Config interno.

## Dipende da

[Fase 140 — Communication](../140-communication/README.md)

## Risultato visibile

Un payload CBOR valido viene applicato; payload incompleti o extra vengono rifiutati.

## Task

1. ⬜ [TASK-150-01 — Documentare lo schema CBOR V0](TASK-150-01-document-the-cbor-v0-schema.md)
2. ⬜ [TASK-150-02 — Dichiarare il confine del decoder Config](TASK-150-02-declare-the-config-decoder-boundary.md)
3. ⬜ [TASK-150-03 — Abilitare zcbor e aggiungere il sorgente codec](TASK-150-03-enable-zcbor-and-add-the-codec-source.md)
4. ⬜ [TASK-150-04 — Implementare la decodifica CBOR V0 rigorosa](TASK-150-04-implement-strict-cbor-v0-decoding.md)
5. ⬜ [TASK-150-05 — Applicare CBOR tramite Communication](TASK-150-05-apply-cbor-through-communication.md)
6. ⬜ [TASK-150-06 — Provare payload CBOR validi e non validi](TASK-150-06-test-valid-and-invalid-cbor-payloads.md)

## Criteri di completamento della fase

- [ ] Lo schema V0 è documentato prima del decoder.
- [ ] Il decoder non applica direttamente la configurazione.
- [ ] Limiti, campi obbligatori e valori sconosciuti sono provati.
