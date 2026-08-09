# TASK-050-06 — Usare SHT40 tramite la tabella operazioni

**Stato:** ⬜ TODO
**Fase:** 050 — Module + Module Driver
**Dipende da:** [TASK-050-05](TASK-050-05-adapt-sht40-to-driver-operations.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Stessi valori reali di Milestone 4.

---

## File da aprire

`src/main.c`, `CMakeLists.txt` e la console seriale.

---

## Cosa scrivere o modificare

Costruisci uno `spaghetti_module` temporaneo in `main`, puntalo a Port 0 e
`spaghetti_sht40_driver`, e rimpiazza le chiamate wrapper dirette con
`driver->ops->init/read/deinit`. Preserva il loop di visualizzazione di un secondo.

> [!ATTENZIONE]
> SHORTCUT TEMPORANEO
>
> L'istanza principale del modulo è intenzionalmente temporanea e verrà rimossa in
  [TASK-070-05](../070-module-manager/TASK-070-05-integrate-manager-into-core-and-main.md).


---

## Perché

Il registro deve memorizzare un descrittore driver testato.

---

## Chi usa il risultato

Imbragatura principale temporanea.

---

## Evento che attiva il codice

BOOT/PERIODIC LEGGERE.

---

## Meccanismo di invocazione

Chiamata diretta attraverso il tavolo operatorio.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

Sensore SHT4x temporaneo wrapper.

---

## Input

Modulo con Port 0 e campione di uscita.

---

## Output

Stessi valori reali di Milestone 4.

---

## Errori da gestire

Op mancante, Port incompatibile, precedenti errori del sensore.

---

## Non implementare ancora

- Cerca Registry/Manager o zbus

---

## Procedura

- [ ] Aprire solo `src/main.c`, `CMakeLists.txt` e la console seriale.
- [ ] Costruisci uno `spaghetti_module` temporaneo in `main`, puntalo a Port 0 e
      `spaghetti_sht40_driver`, e rimpiazza le chiamate wrapper dirette con
      `driver->ops->init/read/deinit`. Preserva il loop di visualizzazione di un
      secondo.
- [ ] Gestisci solo questi errori realistici: Op mancante, Port incompatibile, errori
      precedenti del sensore.
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

Assicurarsi che le funzioni di calcestruzzo `sensor_*` o SHT40 non siano mai chiamate
direttamente; chiama puntatori operativi.

---

## Risultato atteso

Le letture reali sono immutate e `main` non chiama più direttamente l'API di
implementazione SHT40.

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

`module: exercise sht40 through the operation table`

---

## Task successivo

[TASK-060-01](../060-driver-registry/TASK-060-01-declare-the-driver-registry-api.md) — Dichiarare l’API di Driver Registry
