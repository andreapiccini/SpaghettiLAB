# S024 — Streaming eventi e fixture fake

**Stato:** ⬜ TODO
**Dipende da:** S022, S023

## Obiettivo

Rendere osservabili in streaming record ed eventi del Core, e permettere lo sviluppo
dell'applicazione senza hardware fisico.

## Implementazione richiesta

1. Implementa stream eventi con backpressure, unsubscribe, reconnect e segnalazione di
   gap tramite boot ID, sequence e drop counter.
2. Pubblica fixture fake deterministiche per testare l'app senza Core fisico.

## Verifiche

- uno stream sotto pressione applica backpressure invece di accumulare senza limite;
- un reconnect con boot ID cambiato segnala esplicitamente il gap, non lo nasconde;
- le fixture fake riproducono deterministicamente le stesse sequenze fra run di test.

## Fine task

- [ ] Streaming e perdita dati sono espliciti, mai silenziosi.
- [ ] Fixture e contract test non richiedono rete reale.
