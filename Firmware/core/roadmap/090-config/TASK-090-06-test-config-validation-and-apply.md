# TASK-090-06 — Provare validazione e applicazione di Config

**Stato:** ⬜ TODO
**Fase:** 090 — Config interna
**Dipende da:** [TASK-090-05](TASK-090-05-add-and-apply-one-hardcoded-c-config.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

istanza SHT40 e letture reali.

---

## File da aprire

`subsys/config/config.c`, l'infrastruttura di test di prova corrente e la console seriale.

---

## Cosa scrivere o modificare

Provare l'istantanea valida più la versione difettosa, il conteggio eccessivo, il
duplicato Port, il tipo sconosciuto, l'indirizzo non valido e il periodo zero.
Confermare le istantanee non valide non fanno un'assegnazione parziale dal vivo e quella
valida conserva SHT40 reale legge.

---

## Perché

Isola i fallimenti della configurazione semantica dai futuri fallimenti del
decodificatore.

---

## Chi usa il risultato

Prova Main/Core.

---

## Evento che attiva il codice

Test del bolide.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

Config validate/apply -> Manager.

---

## Input

Oggetto interno hardcoded.

---

## Output

istanza SHT40 e letture reali.

---

## Errori da gestire

Log config validation/apply errore distintamente.

---

## Non implementare ancora

- Encode/decode o storage

---

## Procedura

- [ ] Aprire solo `subsys/config/config.c`, l'infrastruttura di test di prova corrente e la console
      seriale.
- [ ] Prova l'istantanea valida più la versione difettosa, il conteggio eccessivo, il
      duplicato Port, il tipo sconosciuto, l'indirizzo non valido e il periodo zero.
- [ ] Confermare le istantanee non valide non fanno un'assegnazione parziale dal vivo e
      quella valida conserva SHT40 reale legge.
- [ ] Gestisci solo questi errori realistici: Log config validation/apply errore
      distintamente.
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

Cambiare il periodo di prova non valido a 0 e verificare nessuna chiamata Manager;
ripristinare 1000.

---

## Risultato atteso

Solo una configurazione interna completamente valida cambia stato del Module Manager.

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

`internal: test config validation and apply`

---

## Task successivo

[TASK-100-01](../100-storage/TASK-100-01-define-the-synchronous-storage-api.md) — Definire l’API di storage sincrono
