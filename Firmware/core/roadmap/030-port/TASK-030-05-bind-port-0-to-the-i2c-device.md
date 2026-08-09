# TASK-030-05 — Associare Port 0 al device I2C

**Stato:** ⬜ TODO
**Fase:** 030 — Port
**Dipende da:** [TASK-030-04](TASK-030-04-implement-the-private-port-descriptor.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Uno Port pronto o `-ENODEV`.

---

## File da aprire

`subsys/port/port.c`.

---

## Orientamento Zephyr — Zephyr Device Model e DEVICE_DT_GET

1. **Cos’è:** Il Device Model rappresenta periferiche inizializzate da Zephyr tramite `struct device`. `DEVICE_DT_GET()` converte un nodo Devicetree noto a build-time nel puntatore al relativo device.
2. **A cosa serve:** Consente a Port 0 di conservare il controller I2C senza creare manualmente un driver o una struttura hardware.
3. **Quando viene usato:** La macro risolve il riferimento durante la build; `device_is_ready()` controlla a runtime che inizializzazione e dipendenze siano riuscite.
4. **Build-time o runtime:** Riferimento a build-time, verifica e utilizzo a runtime.
5. **Collegamento con questo task:** Il descrittore privato di Port 0 deve puntare al controller I2C abilitato nella fase 020.
6. **File reali coinvolti:** `subsys/port/port.c`; per verifica anche `build/zephyr/zephyr.dts` e l’header Devicetree generato.
7. **Cosa guardare nei file:** Individua la node label I2C reale, la chiamata `DEVICE_DT_GET()` e il controllo `device_is_ready()`.
8. **Cosa non modificare:** Non istanziare `struct device`, non chiamare direttamente l’init del driver e non usare una label inventata.

---

## Cosa scrivere o modificare

In `spaghetti_port_init_all()`, ottenere il controller verificato con
`DEVICE_DT_GET(DT_NODELABEL(...))`, memorizzarlo in Port 0, e restituire `-ENODEV`
quando `device_is_ready()` è falso. Implementa `spaghetti_port_i2c_device()` con
controlli null e funzionalità.

---

## Perché

Il feedback hardware è più prezioso della progettazione di tutte le varianti Port.

---

## Chi usa il risultato

Core e SHT40 wrapper.

---

## Evento che attiva il codice

AVVIO.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale.

---

## Chiamate e dipendenze

Macro Devicetree, `DEVICE_DT_GET`, `device_is_ready`.

---

## Input

DTS compilato statico.

---

## Output

Uno Port pronto o `-ENODEV`.

---

## Errori da gestire

Controllore absent/not ricerca pronta e non valida.

---

## Non implementare ancora

- Mutex a meno che due utenti effettivi non condividano l'accesso multi-step

---


## Procedura

- [ ] Apri solo `subsys/port/port.c`.
- [ ] In `spaghetti_port_init_all()`, ottenere il controller verificato con
      `DEVICE_DT_GET(DT_NODELABEL(...))`, memorizzarlo in Port 0, e restituire `-ENODEV`
      quando `device_is_ready()` è falso.
- [ ] Implementa `spaghetti_port_i2c_device()` con controlli null e funzionalità.
- [ ] Gestisci solo questi errori realistici: Controller absent/not ricerca pronta e non
      valida.
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

Ispezione a livello di unità del comportamento di ID bounds/null.

---

## Risultato atteso

Un descrittore privato e nessuna conoscenza del modulo.

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

`port: bind port 0 to the i2c device`

---

## Task successivo

[TASK-030-06](TASK-030-06-add-port-to-cmake.md) — Aggiungere Port alla build CMake
