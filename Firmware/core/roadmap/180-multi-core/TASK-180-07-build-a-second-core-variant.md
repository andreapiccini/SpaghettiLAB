# TASK-180-07 — Compilare una seconda variante Core

**Stato:** ⬜ TODO
**Fase:** 180 — Varianti Core multiple
**Dipende da:** [TASK-180-06](TASK-180-06-build-and-test-the-first-real-core-board.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

I livelli più alti comuni compilano ed elencano correttamente.

---

## File da aprire

Una seconda directory reale della scheda, o un dispositivo di prova chiaramente chiamato
solo build quando l'hardware non esiste.

---

## Cosa scrivere o modificare

Descrivi un set Port diverso verificato o esplicitamente simulato. Costruisci Core
immutato, Manager, Runtime, Dati e codice modulo; sostituisci qualsiasi ramo di
nome-board con query di capacità.

---

## Perché

L'enumerazione Port generata è completa.

---

## Chi usa il risultato

Costruisci matrix/tests.

---

## Evento che attiva il codice

BUILD.

---

## Meccanismo di invocazione

BUILD-TIME.

---

## Contesto di esecuzione

Host CI/developer.

---

## Chiamate e dipendenze

Seconda scheda DTS/Kconfig.

---

## Input

Diversi number/capabilities.

---

## Output

I livelli più alti comuni compilano ed elencano correttamente.

---

## Errori da gestire

Modulo non supportato sulla porta di capacità -> `-ENOTSUP`.

---

## Non implementare ancora

- Branching del nome di bordo Runtime

---

## Procedura

- [ ] Aprire solo una seconda directory reale della scheda, o un dispositivo di test di
      build-only chiaramente chiamato quando l'hardware non esiste.
- [ ] Descrivi un set Port diverso verificato o esplicitamente simulato. Costruisci il
      codice Core immodificato, Manager, Runtime, Dati e modulo
- [ ] sostituire qualsiasi ramo di nome-board con query di funzionalità.
- [ ] Gestisci solo questi errori realistici: modulo non supportato sulla porta di
      capacità -> `-ENOTSUP`.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine`

---

## Flash

NO

---

## Verifica

Costruisci entrambe le varianti e confronta Port generato counts/capabilities; cerca
livelli più alti per i condizionali C3/S3 nome scheda.

---

## Risultato atteso

Entrambe le varianti sono costruite con livelli più alti comuni e nessun ramo di policy
del nome MCU.

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

`multiple: build a second core variant`

---

## Task successivo

[TASK-190-01](../190-power/TASK-190-01-verify-controllable-power-hardware.md) — Verificare l’hardware di alimentazione controllabile
