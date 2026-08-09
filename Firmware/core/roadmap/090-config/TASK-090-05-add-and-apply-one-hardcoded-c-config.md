# TASK-090-05 — Aggiungere e applicare una Config C statica

**Stato:** ⬜ TODO
**Fase:** 090 — Config interna
**Dipende da:** [TASK-090-04](TASK-090-04-implement-config-apply.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

istanza SHT40 e letture reali.

---

## File da aprire

`CMakeLists.txt` e `subsys/core/core.c` o `src/main.c`.

---

## Cosa scrivere o modificare

Aggiungi `subsys/config/config.c` a CMake. Costruisci uno `spaghetti_config` per Port 0,
`sht40`, l'indirizzo verificato e 1000 ms; chiama `spaghetti_config_apply()` invece di
configurare Manager diretto.

> [!ATTENZIONE]
> SHORTCUT TEMPORANEO
>
> L'istantanea hardcoded C è intenzionalmente temporanea e verrà rimossa in
  [TASK-150-05](../150-cbor/TASK-150-05-apply-cbor-through-communication.md).


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

- [ ] Apri solo `CMakeLists.txt` e `subsys/core/core.c` o `src/main.c`.
- [ ] Aggiungi `subsys/config/config.c` a CMake.
- [ ] Costruisci uno `spaghetti_config` per Port 0, `sht40`, l'indirizzo verificato, e
      1000 ms
- [ ] Chiama `spaghetti_config_apply()` invece della configurazione direct Manager.
- [ ] Gestisci solo questi errori realistici: Log config validation/apply errore
      distintamente.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

NO

---

## Verifica

Cambiare il periodo di prova non valido a 0 e verificare nessuna chiamata Manager;
ripristinare 1000.

---

## Risultato atteso

`Config -> Manager -> Registry -> SHT40` funziona.

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

`internal: add and apply one hardcoded c config`

---

## Task successivo

[TASK-090-06](TASK-090-06-test-config-validation-and-apply.md) — Provare validazione e applicazione di Config
