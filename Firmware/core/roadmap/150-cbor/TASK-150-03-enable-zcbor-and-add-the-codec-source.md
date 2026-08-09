# TASK-150-03 — Abilitare zcbor e aggiungere il sorgente codec

**Stato:** ⬜ TODO
**Fase:** 150 — CBOR
**Dipende da:** [TASK-150-02](TASK-150-02-declare-the-config-decoder-boundary.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Config interna.

---

## File da aprire

`prj.conf`, `CMakeLists.txt` e crea `subsys/config/config_cbor.c`.

---

## Orientamento Zephyr — zcbor

1. **Cos’è:** zcbor è la libreria integrata da Zephyr per codificare e decodificare CBOR con stato e buffer limitati.
2. **A cosa serve:** Trasforma bytes di Communication nel modello Config senza parser testuale o allocazioni non controllate.
3. **Quando viene usato:** Kconfig e CMake includono la libreria a build-time; il decoder opera a runtime su un buffer ricevuto.
4. **Build-time o runtime:** Integrazione a build-time, decodifica a runtime.
5. **Collegamento con questo task:** Lo schema V0 è già definito; questo task prepara il sorgente che lo implementerà.
6. **File reali coinvolti:** `prj.conf`, `CMakeLists.txt` e il nuovo `subsys/config/config_cbor.c`.
7. **Cosa guardare nei file:** Controlla l’opzione zcbor disponibile, gli header installati e l’inclusione del nuovo sorgente nel target `app`.
8. **Cosa non modificare:** Non copiare una seconda versione di zcbor, non accettare campi extra e non applicare Config direttamente dal decoder.

---

## Cosa scrivere o modificare

Abilitare `CONFIG_ZCBOR=y` e aggiungere `config_cbor.c` alle sorgenti dell’applicazione.
Confermare le forniture di integrazione Zephyr installate richiede zcbor
header e sorgenti; non importare nel repository una seconda copia della libreria.

---

## Perché

Il modulo zcbor viene confermato installato a `/opt/zephyrproject/modules/lib/zcbor` con
integrazione `CONFIG_ZCBOR`.

---

## Chi usa il risultato

Communication.

---

## Evento che attiva il codice

SET_CONFIG byte.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Communication/shell thread.

---

## Chiamate e dipendenze

Le funzioni di decodifica zcbor poi `spaghetti_config_validate`.

---

## Input

Esatto V0 CBOR byte.

---

## Output

Config interna.

---

## Errori da gestire

Tutti gli errori parse/bounds mappano un errore Communication stabile; non lasciare uno
stato attivo parzialmente riempito.

---

## Non implementare ancora

- Requisiti di codifica canonica a meno che il protocollo non lo richieda

---


## Procedura

- [ ] Apri solo `prj.conf`, `CMakeLists.txt` e crea `subsys/config/config_cbor.c`.
- [ ] Abilita `CONFIG_ZCBOR=y` e aggiungi `config_cbor.c` alle sorgenti
      dell'applicazione.
- [ ] Confermare le forniture di integrazione Zephyr installate richieste zcbor
      headers/sources
- [ ] Non importare nel repository una seconda copia della libreria.
- [ ] Gestisci solo questi errori realistici: Tutti gli errori parse/bounds mappano un
      errore Communication stabile; non lasciare uno stato attivo parzialmente riempito.
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

Vettore valido più vuoto, troncato ad ogni byte, tipo sbagliato, conteggio in eccesso,
versione sconosciuta, spazzatura finale.

---

## Risultato atteso

Solo il vettore valido produce Config.

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

`cbor: enable zcbor and add the codec source`

---

## Task successivo

[TASK-150-04](TASK-150-04-implement-strict-cbor-v0-decoding.md) — Implementare la decodifica CBOR V0 rigorosa
