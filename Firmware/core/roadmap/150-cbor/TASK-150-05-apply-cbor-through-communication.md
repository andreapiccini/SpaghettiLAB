# TASK-150-05 — Applicare CBOR tramite Communication

**Stato:** ⬜ TODO
**Fase:** 150 — CBOR
**Dipende da:** [TASK-150-04](TASK-150-04-implement-strict-cbor-v0-decoding.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Acquisizione SHT40 applicata e 1000 ms.

---

## File da aprire

`subsys/communication/communication.c` e `subsys/communication/communication_shell.c`.

---

## Cosa scrivere o modificare

Fai chiamare SET_CONFIG il decoder CBOR e poi `spaghetti_config_apply()`. Mantieni la
shell `apply` limitata alla conversione esadecimale limitata. Restituisci decodifica
separata, convalida semantica e applica errori.

---

## Perché

Ogni strato a valle funziona già localmente.

---

## Chi usa il risultato

Shell PC/developer.

---

## Evento che attiva il codice

RICEZIONE COMUNICAZIONE.

---

## Meccanismo di invocazione

SHELL COMMAND -> Catena di chiamata diretta.

---

## Contesto di esecuzione

Shell thread inizialmente.

---

## Chiamate e dipendenze

Communication -> codec -> Config -> Manager/Runtime.

---

## Input

Configurazione valida codificata Port 0/SHT40 V0.

---

## Output

Acquisizione SHT40 applicata e 1000 ms.

---

## Errori da gestire

Hex, decodificare, convalidare, applicare i guasti in modo indipendente.

---

## Non implementare ancora

- Logica specifica per il trasporto nel decoder o nell'accesso Manager CBOR

---

## Procedura

- [ ] Apri solo `subsys/communication/communication.c` e
      `subsys/communication/communication_shell.c`.
- [ ] Fai chiamare SET_CONFIG il decoder CBOR e poi `spaghetti_config_apply()`.
- [ ] Mantenere la shell `apply` limitata alla conversione esadecimale limitata.
- [ ] Restituisce decodifica distinta, convalida semantica e applica errori.
- [ ] Gestisci solo questi errori realistici: Hex, decodifica, convalida, applica errori
      in modo indipendente.
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

Inviare le varianti V0 e malformate valide; successivamente lo stato della query.

---

## Risultato atteso

Valido CBOR configura SHT40; byte non validi non cambiano stato live.

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

`cbor: apply cbor through communication`

---

## Task successivo

[TASK-150-06](TASK-150-06-test-valid-and-invalid-cbor-payloads.md) — Provare payload CBOR validi e non validi
