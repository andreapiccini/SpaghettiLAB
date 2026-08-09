# TASK-150-06 — Provare payload CBOR validi e non validi

**Stato:** ⬜ TODO
**Fase:** 150 — CBOR
**Dipende da:** [TASK-150-05](TASK-150-05-apply-cbor-through-communication.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Acquisizione SHT40 applicata e 1000 ms.

---

## File da aprire

L'imbracatura di prova del codec, la shell USB e la console seriale.

---

## Cosa scrivere o modificare

Provare un payload V0 valido più ingresso troncato, tipo errato, stringa oversize,
versione sconosciuta, byte di completamento, indirizzo non valido e Manager applicare il
guasto. Confermare payload falliti non modificare l'istantanea attiva.

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

- [ ] Aprire solo l'imbracatura di test del codec, la shell USB e la console seriale.
- [ ] Provare un payload V0 valido più ingresso troncato, tipo errato, stringa oversize,
      versione sconosciuta, byte di completamento, indirizzo non valido e Manager
      applicare il guasto.
- [ ] Confermare che i payload falliti non alterano l'istantanea attiva.
- [ ] Gestisci solo questi errori realistici: Hex, decodifica, convalida, applica errori
      in modo indipendente.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make build`

---

## Flash

SÌ — eseguire `make flash`, poi `make screen`; passare `PORT=...` solo quando
necessario.

---

## Verifica

Inviare le varianti V0 e malformate valide; successivamente lo stato della query.

---

## Risultato atteso

Una configurazione CBOR valida si applica tramite Communication; ogni carico utile
malformato o non valido è atomico e rifiutato.

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

`cbor: test valid and invalid cbor payloads`

---

## Task successivo

[TASK-160-01](../160-mqtt/TASK-160-01-choose-the-development-network-path.md) — Scegliere il percorso di rete per lo sviluppo
