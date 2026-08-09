# TASK-090-03 — Implementare la validazione di Config

**Stato:** ⬜ TODO
**Fase:** 090 — Config interna
**Dipende da:** [TASK-090-02](TASK-090-02-make-config-string-ownership-explicit.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Moduli applicati(s) o errore validation/apply esatto.

---

## File da aprire

`subsys/config/config.c`.

---

## Cosa scrivere o modificare

Implementa la convalida pura per la versione, il conteggio dei moduli, gli ID Port, gli
ID di tipo terminati non vuoti, l'intervallo di indirizzi I2C, le assegnazioni duplicate
Port e il periodo di campionamento non limitato a zero. Non mutare lo stato live
Manager.

---

## Perché

Il codice principale può essere sostituito senza serializzazione.

---

## Chi usa il risultato

Principale ora; Communication/decoder più tardi.

---

## Evento che attiva il codice

COMANDO DI CONFIGURAZIONE.

---

## Meccanismo di invocazione

CHIAMATA DIRETTA.

---

## Contesto di esecuzione

Thread principale o thread chiamante.

---

## Chiamate e dipendenze

Configura Module Manager.

---

## Input

Config interna completa.

---

## Output

Moduli applicati(s) o errore validation/apply esatto.

---

## Errori da gestire

Applicazione parziale. Per un modulo, il rollback è semplice; strategia di transazione
del documento prima di più moduli.

---

## Non implementare ancora

- Stato persistente, CBOR, configurazione asincrona worker

---

## Procedura

- [ ] Apri solo `subsys/config/config.c`.
- [ ] Implementa la convalida pura per la versione, il conteggio dei moduli, gli ID
      Port, gli ID tipo terminati non vuoti, l'intervallo di indirizzi I2C, le
      assegnazioni Port duplicate e il periodo di campionamento non limitato a zero.
- [ ] Non mutare live Manager State.
- [ ] Gestisci solo questi errori realistici: Applicazione parziale. Per un modulo, il
      rollback è semplice; strategia di transazione del documento prima di più moduli.
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

Convalida configurazione valida più versione difettosa, duplicate/invalid Port, periodo
zero.

---

## Risultato atteso

Config non valida non chiama mai Manager.

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

`internal: implement config validation`

---

## Task successivo

[TASK-090-04](TASK-090-04-implement-config-apply.md) — Implementare l’applicazione di Config
