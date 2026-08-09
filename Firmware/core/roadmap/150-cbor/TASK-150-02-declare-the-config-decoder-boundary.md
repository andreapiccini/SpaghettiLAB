# TASK-150-02 — Dichiarare il confine del decoder Config

**Stato:** ⬜ TODO
**Fase:** 150 — CBOR
**Dipende da:** [TASK-150-01](TASK-150-01-document-the-cbor-v0-schema.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Completamente di proprietà `spaghetti_config` o errore di decodifica negativa.

---

## File da aprire

Crea `include/spaghetti/config_codec.h`.

---

## Cosa scrivere o modificare

Dichiara `spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length, struct
spaghetti_config *out)`. Documento che l'output cambia solo dopo un completo successo
sintattico e semantico.

---

## Perché

Il percorso interno Config è già dimostrato end-to-end.

---

## Chi usa il risultato

Gestore Communication SET_CONFIG.

---

## Evento che attiva il codice

RICEZIONE COMUNICAZIONE.

---

## Meccanismo di invocazione

Decodificatore di chiamata diretta.

---

## Contesto di esecuzione

Shell/Communication thread.

---

## Chiamate e dipendenze

Decodificatore zcbor e validatore Config.

---

## Input

Byte span senza terminazione presunta.

---

## Output

Completamente di proprietà `spaghetti_config` o errore di decodifica negativa.

---

## Errori da gestire

Trunched, wrong type/key/version, oversize string/count, trailing inatteso byte,
semantic Config rifiuto.

---

## Non implementare ancora

- Schema runtime graph/MQTT/discovery completo o decodifica diretta Manager

---

## Procedura

- [ ] Apri solo Crea `include/spaghetti/config_codec.h`.
- [ ] Dichiara `spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length, struct
      spaghetti_config *out)`.
- [ ] Documenta che l'output cambia solo dopo il completo successo sintattico e
      semantico.
- [ ] Gestisci solo questi errori realistici: Truncato, sbagliato type/key/version,
      sovradimensionato string/count, inseguito byte inaspettati, rifiuto semantico
      Config.
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

Verificare che l'output non contenga alcun puntatore nel buffer di input a meno che la
sua vita non sia copiata esplicitamente prima del ritorno.

---

## Risultato atteso

Pulisci il confine del codec.

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

`cbor: declare the config decoder boundary`

---

## Task successivo

[TASK-150-03](TASK-150-03-enable-zcbor-and-add-the-codec-source.md) — Abilitare zcbor e aggiungere il sorgente codec
