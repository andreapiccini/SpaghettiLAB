# TASK-030-08 — Provare Port con ID validi e non validi

**Stato:** ⬜ TODO
**Fase:** 030 — Port
**Dipende da:** [TASK-030-07](TASK-030-07-initialize-port-from-core.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Log equivalente a `Port 0: I2C ready`.

---

## File da aprire

`subsys/port/port.c`, `subsys/core/core.c` e la console seriale.

---

## Cosa scrivere o modificare

Esercizio Port 0 e un ID fuori gamma attraverso l'API pubblica. Verificare Port 0 è
pronto e l'ID non valido restituisce `NULL` senza dereferenziarlo. Provare
temporaneamente il percorso di guasto del controller disabilitato senza effettuare il
test overlay cambiamento.

---

## Perché

SHT40 non deve essere aggiunto fino a quando Port non segnala il controller reale
pronto.

---

## Chi usa il risultato

Costruisci e Core.

---

## Evento che attiva il codice

AVVIO.

---

## Meccanismo di invocazione

CAMPIONE DEL TEMPO E CHIAMATA DIRETTAMENTE.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

Port init/count/capability.

---

## Input

Controllore abilitato da Milestone 2.

---

## Output

Log equivalente a `Port 0: I2C ready`.

---

## Errori da gestire

Propaga l'errore negativo Port; non è pronto silenzioso.

---

## Non implementare ancora

- SHT40 o registro

---

## Procedura

- [ ] Aprire solo `subsys/port/port.c`, `subsys/core/core.c` e la console seriale.
- [ ] Esercizio Port 0 e un ID fuori gamma attraverso l'API pubblica.
- [ ] Verificare che Port 0 sia pronto e l'ID non valido restituisce `NULL` senza
      dereferenziarlo. Provare temporaneamente il percorso di guasto del controllore
      disabilitato senza effettuare il test overlay.
- [ ] Gestire solo questi errori realistici: Propagare l'errore negativo Port; nessun
      silent READY.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`; utilizzare `make pristine` solo per il test temporaneo di guasto
overlay.

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Avviare normalmente, quindi disattivare temporaneamente il controller in un ramo di test
e confermare Port init fallisce; ripristinarlo immediatamente.

---

## Risultato atteso

Port 0 segnala la prontezza I2C, la ricerca non valida fallisce in modo sicuro e Core
propaga il fallimento del controller.

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

`port: test port success and invalid ids`

---

## Task successivo

[TASK-040-01](../040-sht40/TASK-040-01-inspect-the-installed-sht4x-driver.md) — Esaminare il driver SHT4x fornito da Zephyr
