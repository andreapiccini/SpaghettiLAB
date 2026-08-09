# TASK-140-03 — Abilitare Zephyr Shell

**Stato:** ⬜ TODO
**Fase:** 140 — Communication
**Dipende da:** [TASK-140-02](TASK-140-02-declare-and-implement-request-dispatch.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Risposta allo stato Core/modules/runtime.

---

## File da aprire

`prj.conf` e la console esistente overlay.

---

## Orientamento Zephyr — Zephyr Shell

1. **Cos’è:** Zephyr Shell è un sottosistema che interpreta comandi testuali e chiama handler C registrati.
2. **A cosa serve:** Fornisce il primo trasporto locale per provare Communication senza introdurre subito rete o MQTT.
3. **Quando viene usato:** Kconfig include Shell nella build; a runtime il relativo thread riceve caratteri dalla console e invoca gli handler.
4. **Build-time o runtime:** Selezione a build-time, comandi a runtime.
5. **Collegamento con questo task:** Il task abilita l’infrastruttura; l’adattatore Spaghetti LAB viene implementato nel task successivo.
6. **File reali coinvolti:** `prj.conf` e l’overlay/configurazione della console già esistente.
7. **Cosa guardare nei file:** Controlla `CONFIG_SHELL`, backend seriale selezionato e device console effettivo.
8. **Cosa non modificare:** Non cambiare la console, non conservare `argv` dopo il ritorno dell’handler e non eseguire lavoro lungo o non limitato.

---

## Cosa scrivere o modificare

Abilita `CONFIG_SHELL=y` e verifica la shell scelta esistente UART rimane `usb_serial`.
Aggiungi solo le dipendenze richieste dalla shell riportate da Kconfig installata; non
cambiare il dispositivo di lavoro della console.

---

## Perché

Nessun trasporto USB CDC/BLE/network deve essere inventato.

---

## Chi usa il risultato

Developer/PC via seriale USB.

---

## Evento che attiva il codice

Commandera'/Comunicazione RX.

---

## Meccanismo di invocazione

SHELL COMMAND -> DIRECT CALL.

---

## Contesto di esecuzione

Zephyr shell thread; sicuro per l'analisi delimitata, ma non eseguire un lungo lavoro di
blocco durante la tenuta interna della shell.

---

## Chiamate e dipendenze

Zephyr Shell, Communication Handler, Config/Status.

---

## Input

Prima `spaghetti status`.

---

## Output

Risposta allo stato Core/modules/runtime.

---

## Errori da gestire

Argomenti sbagliati, esadecimale sovradimensionato, Config non disponibile.

---

## Non implementare ancora

- CBOR fino al Passo 15, framing binario, autenticazione

---


## Procedura

- [ ] Aprire solo `prj.conf` e la console esistente overlay.
- [ ] Abilita `CONFIG_SHELL=y` e verifica l'attuale shell scelta UART rimane
      `usb_serial`.
- [ ] Aggiungi solo dipendenze di shell richieste segnalate da Kconfig installato
- [ ] non cambiare il dispositivo di console di lavoro.
- [ ] Gestisci solo questi errori realistici: Argomenti sbagliati, esagono
      sovradimensionato, Config non disponibile.
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

Dalla console seriale esistente eseguire aiuto, stato valido, comando non valido.

---

## Risultato atteso

Il comando Shell raggiunge il gestore indipendente dal trasporto.

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

`communication: enable the zephyr shell`

---

## Task successivo

[TASK-140-04](TASK-140-04-implement-the-shell-transport-adapter.md) — Implementare l’adattatore di trasporto Shell
