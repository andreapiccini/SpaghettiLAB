# TASK-100-05 — Implementare il record persistente con Settings

**Stato:** ⬜ TODO
**Fase:** 100 — Config persistente
**Dipende da:** [TASK-100-04](TASK-100-04-enable-zephyr-settings-and-its-backend.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Registrare ripristinato dopo il ciclo di potenza.

---

## File da aprire

`subsys/services/storage/storage.c` e `CMakeLists.txt`.

---

## Cosa scrivere o modificare

Registra un handler di Zephyr Settings. Nella callback, decodifica il record di
configurazione con versione fissa e caricalo nello stato privato del componente
Storage. Implementa il salvataggio tramite l'API Settings, aggiungi il sorgente a CMake
e propaga gli errori restituiti dal backend.

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

- [ ] Apri solo `subsys/services/storage/storage.c` e `CMakeLists.txt`.
- [ ] Registrare un gestore Settings, decodificare il record di configurazione in
      versione fissa in un CALLBACK SETTINGS, caricarlo nello stato di storage privato e
      salvare con l'API Settings.
- [ ] Aggiungi sorgente di archiviazione a CMake e propaga gli errori backend.
- [ ] Gestisci solo questi errori realistici: Missing/corrupt/full/I/O; mai cancellare
      flash non correlati.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

NO

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

`persistent: implement the settings-backed storage record`

---

## Task successivo

[TASK-100-06](TASK-100-06-load-config-at-boot-and-test-persistence.md) — Caricare Config all’avvio e provare la persistenza
