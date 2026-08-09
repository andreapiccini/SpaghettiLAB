# TASK-180-02 — Convalidare il binding di Port

**Stato:** ⬜ TODO
**Fase:** 180 — Varianti Core multiple
**Dipende da:** [TASK-180-01](TASK-180-01-define-the-spaghetti-port-binding.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Macro DT generate.

---

## File da aprire

`dts/bindings/spaghetti/spaghettilab,port.yaml` e un nodo di prova minimo nell'apposita
board/test DTS.

---

## Cosa scrivere o modificare

Eseguire una configurazione pulita con un nodo valido, quindi verificare le
proprietà richieste mancanti e le referenze non valide falliscono la convalida
Devicetree. Rimuovere qualsiasi nodo di prova deliberatamente non valido dopo il
controllo.

---

## Perché

Uno Core/Port funziona e i suoi requisiti minimi effettivi sono noti.

---

## Chi usa il risultato

Generazione Devicetree e macro `port.c`.

---

## Evento che attiva il codice

BUILD.

---

## Meccanismo di invocazione

BUILD-TIME.

---

## Contesto di esecuzione

Host DT tools/compiler.

---

## Chiamate e dipendenze

Schema Zephyr binding e scheda reale DTS.

---

## Input

Nodi statici validi Port.

---

## Output

Macro DT generate.

---

## Errori da gestire

Il riferimento property/wrong mancante deve essere generato.

---

## Non implementare ancora

- Identità del modulo Runtime o funzionalità immaginarie

---

## Orientamento Zephyr

I legami sono schemi YAML usati al momento della compilazione per convalidare i nodi DTS
e generare macro C. Devono descrivere l'hardware statico Core, non l'identità del modulo
runtime.

---

## Procedura

- [ ] Aprire solo `dts/bindings/spaghetti/spaghettilab,port.yaml` e un nodo di prova
      minimo nell'apposita board/test DTS.
- [ ] Eseguire una configurazione pulita con un nodo valido, quindi verificare le
      proprietà richieste mancanti e le referenze non valide non riescono a convalidare
      Devicetree.
- [ ] Rimuovere qualsiasi nodo di prova deliberatamente non valido dopo il controllo.
- [ ] Gestisci solo questi errori realistici: La mancanza di riferimento property/wrong
      deve fallire la compilazione.
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

Costruisce un nodo valido; manca intenzionalmente il campo richiesto non riesce, quindi
ripristina.

---

## Risultato atteso

Convalida utile build-time.

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

`multiple: validate the port binding`

---

## Task successivo

[TASK-180-03](TASK-180-03-create-the-first-real-spaghetti-board-skeleton.md) — Creare la prima definizione board Spaghetti LAB
