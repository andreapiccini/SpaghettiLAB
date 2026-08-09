# TASK-100-03 — Verificare e definire la partizione di storage

**Stato:** ⬜ TODO
**Fase:** 100 — Config persistente
**Dipende da:** [TASK-100-02](TASK-100-02-implement-and-test-a-ram-storage-backend.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Registrare ripristinato dopo il ciclo di potenza.

---

## File da aprire

Il layout flash della scheda verificato e il file di partizione overlay/Devicetree
appropriato.

---

## Cosa scrivere o modificare

Ispezionare le partizioni flash correnti, selezionare una regione reale non sovrapposta
e definisci una partizione fissa `storage` usando il binding già fornito da Zephyr. Non
indovinare un indirizzo o una dimensione.

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

## Orientamento Zephyr

Le partizioni Flash sono un layout hardware di tempo di compilazione. Un offset errato
può sovrascrivere il firmware, quindi i confini di partizione e DTS generati devono
essere ispezionati prima dell'uso.

---

## Procedura

- [ ] Aprire solo il layout flash della scheda verificato e il file di partizione
      overlay/Devicetree appropriato.
- [ ] Ispezionare le partizioni flash correnti, selezionare una regione reale non
      sovrapposta e definire una partizione `storage` fissa utilizzando la sintassi
      Zephyr installata binding.
- [ ] Non indovinare un indirizzo o una dimensione.
- [ ] Gestisci solo questi errori realistici: Missing/corrupt/full/I/O; mai cancellare
      flash non correlati.
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

Salva assegnazione, power-cycle, load/apply; corrupt/version-mismatch prova attraverso
un record di prova controllato, non scrittura flash casuale.

---

## Risultato atteso

Config persiste o ricade esplicitamente.

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

`persistent: verify and define the storage partition`

---

## Task successivo

[TASK-100-04](TASK-100-04-enable-zephyr-settings-and-its-backend.md) — Abilitare Zephyr Settings e il relativo backend
