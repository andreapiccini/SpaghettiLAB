# TASK-100-04 — Abilitare Zephyr Settings e il relativo backend

**Stato:** ⬜ TODO
**Fase:** 100 — Config persistente
**Dipende da:** [TASK-100-03](TASK-100-03-verify-and-define-the-storage-partition.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Registrare ripristinato dopo il ciclo di potenza.

---

## File da aprire

`prj.conf`.

---

## Orientamento Zephyr — Zephyr Settings, NVS e ZMS

1. **Cos’è:** Settings è l’API key/value di Zephyr. NVS e ZMS sono backend che memorizzano quei valori su flash con organizzazioni diverse.
2. **A cosa serve:** Separa il contratto con cui Config salva un record dal formato fisico usato nella partizione.
3. **Quando viene usato:** Kconfig sceglie Settings e il backend durante la build; inizializzazione, lettura e scrittura avvengono a runtime.
4. **Build-time o runtime:** Selezione a build-time, persistenza a runtime.
5. **Collegamento con questo task:** La partizione `storage` è stata verificata nel task precedente; ora puoi collegarla a un backend reale.
6. **File reali coinvolti:** `prj.conf`; la partizione resta nel file Devicetree/partition già definito.
7. **Cosa guardare nei file:** Leggi l’help Kconfig delle opzioni `CONFIG_SETTINGS`, `CONFIG_SETTINGS_NVS` o dell’alternativa disponibile nella versione installata.
8. **Cosa non modificare:** Non abilitare contemporaneamente backend casuali, non cambiare la partizione e non salvare ancora storico misure o segreti.

---

## Cosa scrivere o modificare

Abilitare `CONFIG_SETTINGS=y` e il backend non basato su filesystem verificato nella versione installata,
come `CONFIG_SETTINGS_NVS=y`, solo dopo l'esistenza della partizione di archiviazione.
Aggiungere solo le dipendenze backend richieste da Kconfig warnings/help.

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

- [ ] Apri solo `prj.conf`.
- [ ] Abilitare `CONFIG_SETTINGS=y` e quello verificato installato non-filesystem
      backend, come `CONFIG_SETTINGS_NVS=y`, solo dopo l'esistenza della partizione di
      archiviazione.
- [ ] Aggiungere solo le dipendenze backend richieste da Kconfig warnings/help.
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

`persistent: enable zephyr settings and its backend`

---

## Task successivo

[TASK-100-05](TASK-100-05-implement-the-settings-backed-storage-record.md) — Implementare il record persistente con Settings
