# TASK-150-01 — Documentare lo schema CBOR V0

**Stato:** ⬜ TODO
**Fase:** 150 — CBOR
**Dipende da:** [TASK-140-06](../140-communication/TASK-140-06-test-status-and-malformed-shell-input.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Completamente di proprietà `spaghetti_config` o errore di decodifica negativa.

---

## File da aprire

Crea `subsys/config/spaghetti_config_v0.cddl` o documenta lo schema esatto equivalente
accanto al codec.

---

## Cosa scrivere o modificare

Descrivi un oggetto limitato in versione contenente Port 0, tipo `sht40`, indirizzo
verificato e periodo 1000 ms. Correggi chiavi esatte o ordine array e rifiuti dati
aggiuntivi non specificati.

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

- [ ] Aprire solo Crea `subsys/config/spaghetti_config_v0.cddl` o documentare lo schema
      esatto equivalente accanto al codec.
- [ ] Descrivi un oggetto limitato in versione contenente Port 0, tipo `sht40`,
      indirizzo verificato e periodo 1000 ms. Correggi chiavi esatte o ordine array e
      rifiuti dati aggiuntivi non specificati.
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

`cbor: document the cbor v0 schema`

---

## Task successivo

[TASK-150-02](TASK-150-02-declare-the-config-decoder-boundary.md) — Dichiarare il confine del decoder Config
