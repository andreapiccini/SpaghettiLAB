# TASK-030-04 — Implementare il descrittore privato di Port

**Stato:** ⬜ TODO
**Fase:** 030 — Port
**Dipende da:** [TASK-033-03](TASK-030-03-declare-the-port-public-api.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Uno Port pronto o `-ENODEV`.

---

## File da aprire

`subsys/port/port.c`.

---

## Cosa scrivere o modificare

Definire campi privati `struct spaghetti_port` `id`, `capabilities` e `const struct
device *i2c`. Creare un descrittore Port 0 fisso e implementare i controlli di
conteggio, ricerca e capacità con convalida nulla e limiti.

> [!ATTENZIONE]
> SHORTCUT TEMPORANEO
>
> Questo è intenzionalmente temporaneo e verrà rimosso in
  [TASK-180-05](../180-multi-core/TASK-180-05-enumerate-devicetree-ports.md).


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
- [ ] Definire campi privati `struct spaghetti_port` `id`, `capabilities` e `const
      struct device *i2c`.
- [ ] Crea un descrittore Port 0 fisso e implementa i controlli di conteggio, ricerca e
      capacità con convalida null e limiti.
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

`port: implement the private port descriptor`

---

## Task successivo

[TASK-030-05](TASK-030-05-bind-port-0-to-the-i2c-device.md) — Associare Port 0 al device I2C
