# TASK-150-04 — Implementare la decodifica CBOR V0 rigorosa

**Stato:** ⬜ TODO
**Fase:** 150 — CBOR
**Dipende da:** [TASK-150-03](TASK-150-03-enable-zcbor-and-add-the-codec-source.md)
**Impegno stimato:** Medio

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Config interna.

---

## File da aprire

`subsys/config/config_cbor.c` e lo schema V0.

---

## Cosa scrivere o modificare

Decodificare in una `spaghetti_config` temporanea, applicare ogni tipo, intervallo,
stringa legata, numero di elementi, versione e consumo di ingresso completo, quindi
chiamare la convalida Config e copiare a `out` solo dopo il successo completo.

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

- [ ] Apri solo `subsys/config/config_cbor.c` e lo schema V0.
- [ ] Decodificare in una `spaghetti_config` temporanea, applicare ogni tipo,
      intervallo, stringa legata, numero di elementi, versione e consumo di ingresso
      completo, quindi chiamare la convalida Config e copiare a `out` solo dopo il
      successo completo.
- [ ] Gestisci solo questi errori realistici: Tutti gli errori parse/bounds mappano un
      errore Communication stabile; non lasciare uno stato attivo parzialmente riempito.
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

`cbor: implement strict cbor v0 decoding`

---

## Task successivo

[TASK-150-05](TASK-150-05-apply-cbor-through-communication.md) — Applicare CBOR tramite Communication
