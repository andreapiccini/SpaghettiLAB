# TASK-180-01 — Definire il binding Spaghetti Port

**Stato:** ⬜ TODO
**Fase:** 180 — Varianti Core multiple
**Dipende da:** [TASK-170-05](../170-discovery/TASK-170-05-route-config-assignments-through-discovery.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Macro DT generate.

---

## File da aprire

Crea `dts/bindings/spaghetti/spaghettilab,port.yaml` e consulta
`dts/bindings/spaghetti/README.md`.

---

## Orientamento Zephyr — binding Devicetree personalizzato

1. **Cos’è:** Un binding YAML definisce lo schema dei nodi con un determinato `compatible`: proprietà ammesse, tipi, obbligatorietà e significato.
2. **A cosa serve:** Permette agli strumenti Devicetree di validare ogni Spaghetti Port e generare macro C coerenti.
3. **Quando viene usato:** Il binding viene letto durante la build quando un nodo usa `compatible = "spaghettilab,port"`.
4. **Build-time o runtime:** Build-time.
5. **Collegamento con questo task:** Dopo aver provato Port sul C3, puoi descrivere in modo portabile i Port fisici delle board Spaghetti LAB.
6. **File reali coinvolti:** `dts/bindings/spaghetti/spaghettilab,port.yaml` e `dts/bindings/spaghetti/README.md`.
7. **Cosa guardare nei file:** Definisci `compatible`, proprietà `reg` e soltanto riferimenti hardware già giustificati; documenta tipo e vincoli.
8. **Cosa non modificare:** Non inserire identità di moduli rimovibili, valori runtime, proprietà speculative o sintassi non presente nei binding Zephyr installati.

---

## Cosa scrivere o modificare

Definire `spaghettilab,port` compatibile, richiesto `reg`, e solo riferimenti
bus/power/capability reali giustificati dallo schema. Non aggiungere una proprietà di
tipo modulo rimovibile.

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

## Procedura

- [ ] Aprire solo Crea `dts/bindings/spaghetti/spaghettilab,port.yaml` e consultare
      `dts/bindings/spaghetti/README.md`.
- [ ] Definire `spaghettilab,port` compatibile, necessario `reg`, e solo riferimenti
      bus/power/capability reali giustificati dallo schema.
- [ ] Non aggiungere una proprietà di tipo modulo rimovibile.
- [ ] Gestisci solo questi errori realistici: La mancanza di riferimento property/wrong
      deve fallire la compilazione.
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

`multiple: define the spaghetti port binding`

---

## Task successivo

[TASK-180-02](TASK-180-02-validate-the-port-binding.md) — Convalidare il binding di Port
