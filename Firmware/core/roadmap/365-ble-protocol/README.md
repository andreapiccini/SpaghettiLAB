# Fase 365 — Protocollo Spaghetti su BLE

[← Indice del backlog](../README.md)

**Stato:** ✅ DONE

## Obiettivo

Trasportare lo stesso Protocol V1 su Bluetooth Low Energy con autenticazione
applicativa e risorse bounded.

Autenticazione, principal, replay e cursore dei record restano contratti comuni: BLE
non crea una seconda semantica rispetto a MQTT o USB.

## Task

1. ✅ [TASK-365-01 — Aggiungere il trasporto BLE](TASK-365-01-aggiungere-il-trasporto-ble.md)

## Criteri di completamento della fase

- [x] UUID, framing e auth applicativa sono congelati.
- [x] Capability BLE riflette `CONFIG_BT` / `bt_enable()` utilizzabile.
- [x] Record Delivery BLE ha cursore indipendente; nessuna replay cache locale.
