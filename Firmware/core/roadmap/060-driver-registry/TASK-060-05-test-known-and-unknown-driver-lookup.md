# TASK-060-05 — Provare la ricerca di driver noti e sconosciuti

**Stato:** ⬜ TODO
**Fase:** 060 — Driver Registry
**Dipende da:** [TASK-060-04](TASK-060-04-initialize-the-registry-from-core.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Esattamente il comportamento pointer/null.

---

## File da aprire

`src/main.c` o una posizione temporanea di test focalizzato e la console seriale.

---

## Cosa scrivere o modificare

Chiama `spaghetti_driver_registry_find("sht40")`, `find("does-not-exist")` e
`find(NULL)`. Log/assert un descrittore noto non-null e risultati invalid/unknown nulli,
quindi preserva il percorso di lettura reale corrente.

---

## Perché

Il gestore deve ricevere un registro affidabile.

---

## Chi usa il risultato

Core/test.

---

## Evento che attiva il codice

AVVIO.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

API del registro.

---

## Input

Stringe Known/unknown.

---

## Output

Esattamente il comportamento pointer/null.

---

## Errori da gestire

L'errore di init del registro blocca la disponibilità di Core.

---

## Non implementare ancora

- Gestione o configurazione dinamica

---

## Procedura

- [ ] Aprire solo `src/main.c` o una posizione temporanea di test focalizzato e la
      console seriale.
- [ ] Chiama `spaghetti_driver_registry_find("sht40")`, `find("does-not-exist")` e
      `find(NULL)`. Log/assert un descrittore noto non-null e risultati invalid/unknown
      nulli, quindi preserva il percorso di lettura reale corrente.
- [ ] Gestisci solo questi errori realistici: l'errore di init del Registry
      blocca la prontezza Core.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Osservare il rifiuto noto success/unknown e la lettura continua del sensore.

---

## Risultato atteso

La ricerca conosciuta riesce, la ricerca sconosciuta e nulla fallisce in modo pulito, e
la SHT40 continua a leggere.

---

## Checklist di completamento

- [ ] La documentazione o il file di implementazione richiesto è stato modificato come
      specificato
- [ ] Il tipo, la funzione, la configurazione o il test indicato esiste
- [ ] La build riesce quando il task la richiede
- [ ] La verifica specifica del task passa
- [ ] Non è stata aggiunta funzionalità estranea al task

---

## Commit suggerito

`driver: test known and unknown driver lookup`

---

## Task successivo

[TASK-070-01](../070-module-manager/TASK-070-01-declare-the-module-manager-api.md) — Dichiarare l’API di Module Manager
