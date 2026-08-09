# TASK-100-06 — Caricare Config all’avvio e provare la persistenza

**Stato:** ⬜ TODO
**Fase:** 100 — Config persistente
**Dipende da:** [TASK-100-05](TASK-100-05-implement-the-settings-backed-storage-record.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Registrare ripristinato dopo il ciclo di potenza.

---

## File da aprire

`subsys/core/core.c`, `subsys/config/config.c` e la console seriale.

---

## Cosa scrivere o modificare

Inizializzare Archiviazione prima di Config, caricare l'istantanea salvata, convalidarla
e applicala. Definisci in modo esplicito il comportamento al primo avvio, quando non
esiste ancora una configurazione salvata. Scrivi uno snapshot
valido cambiato, riavviare e confermare lo stesso ritorno dell'assegnazione; i dati
corrupt/version-mismatch devono ripiegare in modo sicuro.

---

## Perché

La semantica Config read/write funziona già senza flash.

---

## Chi usa il risultato

Core/Config.

---

## Evento che attiva il codice

BOOT/CONFIG COMMIT.

---

## Meccanismo di invocazione

Chiamata diretta + richiamo di posizione.

---

## Contesto di esecuzione

Main/calling thread durante il sincrono load/save.

---

## Chiamate e dipendenze

Zephyr Settings, scelta backend, vera e propria partizione fissa.

---

## Input

Record valido e regione flash sicura.

---

## Output

Registrare ripristinato dopo il ciclo di potenza.

---

## Errori da gestire

Missing/corrupt/full/I/O; mai cancellare flash non correlati.

---

## Non implementare ancora

- Inventare una partizione size/address
- derivano da un reale flash

---

## Procedura

- [ ] Aprire solo `subsys/core/core.c`, `subsys/config/config.c` e la console seriale.
- [ ] Inizializzare Archiviazione prima di Config, caricare l'istantanea salvata,
      convalidarla e applicarla. Definisci il comportamento al primo avvio, quando non
      esiste ancora una configurazione salvata.
      Scrivere uno snapshot valido cambiato, riavviare e confermare la stessa
      assegnazione restituisce
- [ ] I dati corrupt/version-mismatch devono ripiegare in modo sicuro.
- [ ] Gestisci solo questi errori realistici: Missing/corrupt/full/I/O; mai cancellare
      flash non correlati.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine`

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Salva assegnazione, power-cycle, load/apply; corrupt/version-mismatch prova attraverso
un record di prova controllato, non scrittura flash casuale.

---

## Risultato atteso

Una configurazione valida sopravvive al riavvio e i dati persi non validi non creano
un'assegnazione parziale del modulo.

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

`persistent: load config at boot and test persistence`

---

## Task successivo

[TASK-110-01](../110-data-zbus/TASK-110-01-define-the-temperature-sample-message.md) — Definire il messaggio del campione di temperatura
