# TASK-010-03 — Aggiungere Core alla build dell’applicazione

**Stato:** ⬜ TODO
**Fase:** 010 — Core
**Dipende da:** [TASK-010-02](TASK-010-02-implement-core-state-and-initialization.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Oggetto Core collegato a `zephyr.elf`.

---

## File da aprire

`CMakeLists.txt` e `prj.conf`.

---

## Orientamento Zephyr — CMake in un’applicazione Zephyr

1. **Cos’è:** CMake costruisce l’elenco dei sorgenti e degli include che formeranno l’applicazione Zephyr.
2. **A cosa serve:** Dice alla build che `subsys/core/core.c` deve essere compilato e che `include/` contiene header pubblici.
3. **Quando viene usato:** Zephyr legge `CMakeLists.txt` durante la configurazione della build, prima della compilazione C.
4. **Build-time o runtime:** Build-time.
5. **Collegamento con questo task:** Senza questa modifica l’API Core può esistere negli header, ma la sua implementazione non entra nel firmware.
6. **File reali coinvolti:** `CMakeLists.txt` nella root del progetto.
7. **Cosa guardare nei file:** Cerca `target_sources(app ...)` e `target_include_directories(app ...)`; `app` è il target applicazione creato da Zephyr.
8. **Cosa non modificare:** Non modificare i file CMake installati da Zephyr e non aggiungere ancora sorgenti di componenti futuri.

---

## Cosa scrivere o modificare

Aggiungere `include` a `target_include_directories(app PRIVATE ...)`, aggiungere
`subsys/core/core.c` a `target_sources(app PRIVATE ...)` e abilitare `CONFIG_LOG=y`
senza rimuovere le opzioni di console esistenti.

---

## Perché

I file `.c` non elencati vengono ignorati da CMake.

---

## Chi usa il risultato

Sistema di generazione Zephyr.

---

## Evento che attiva il codice

BUILD.

---

## Meccanismo di invocazione

BUILD-TIME.

---

## Contesto di esecuzione

CMake/Ninja in Docker.

---

## Chiamate e dipendenze

Obiettivo dell'applicazione Zephyr e registrazione Kconfig.

---

## Input

Obiettivo esistente più due nuove voci.

---

## Output

Oggetto Core collegato a `zephyr.elf`.

---

## Errori da gestire

Percorso relativo errato o directory di inclusione.

---

## Non implementare ancora

- Per-directory CMake/Kconfig

---


## Procedura

- [ ] Apri solo `CMakeLists.txt` e `prj.conf`.
- [ ] Aggiungere `include` a `target_include_directories(app PRIVATE ...)`, aggiungere
      `subsys/core/core.c` a `target_sources(app PRIVATE ...)` e abilitare
      `CONFIG_LOG=y` senza rimuovere le opzioni di console esistenti.
- [ ] Gestisci solo questi errori realistici: percorso relativo errato o directory
      include.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine` perché `prj.conf` cambia.

---

## Flash

NO

---

## Verifica

La generazione non ha alcun errore symbol/include non definito.

---

## Risultato atteso

Generazione di successo con Core compilata ma non chiamata.

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

`core: add core to the application build`

---

## Task successivo

[TASK-010-04](TASK-010-04-call-core-from-main.md) — Chiamare Core da main
