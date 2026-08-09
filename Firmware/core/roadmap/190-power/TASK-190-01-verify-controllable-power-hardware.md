# TASK-190-01 — Verificare l’hardware di alimentazione controllabile

**Stato:** ⬜ TODO
**Fase:** 190 — Power
**Dipende da:** [TASK-180-07](../180-multi-core/TASK-180-07-build-a-second-core-variant.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Lease/status e stato contato di riferimento.

---

## File da aprire

Il vero schema della scheda, Port binding, scheda DTS, e hardware misurato.

---

## Orientamento Zephyr — Power di dominio e power management Zephyr

1. **Cos’è:** In questa fase `Power` è un componente Spaghetti LAB che controlla una rail o enable fisico. Non è ancora il sottosistema Zephyr di sospensione, deep sleep o device power management.
2. **A cosa serve:** Evita di confondere ownership di una risorsa elettrica condivisa con il risparmio energetico globale del sistema.
3. **Quando viene usato:** Prima si verifica lo schema e si misura l’hardware; il controllo runtime verrà implementato nei task successivi.
4. **Build-time o runtime:** Verifica hardware ora; gestione a runtime più avanti.
5. **Collegamento con questo task:** Devi provare che esista davvero una risorsa comandabile prima di definire API e algoritmi.
6. **File reali coinvolti:** Schema reale, binding Port, DTS della board e note di misura; nessun nuovo file Zephyr in questo task.
7. **Cosa guardare nei file:** Identifica segnale enable, polarità, stato al reset, rail alimentate, limiti e comportamento misurabile.
8. **Cosa non modificare:** Non abilitare opzioni Zephyr PM, non inventare wake source/deep sleep e non creare un driver se la rail non è controllabile.

---

## Cosa scrivere o modificare

Identificare una risorsa di energia fisicamente controllabile, controllare la polarità,
stato di avvio sicuro, Port interessati, limiti elettrici, e il comportamento
misurabile on/off. Se non esiste, contrassegnare la fase BLOCKED e non inventare uno.

---

## Perché

Il ciclo di vita del modulo e i fatti statici multi-board sono stabili.

---

## Chi usa il risultato

Ciclo di vita Manager/driver; stato Communication.

---

## Evento che attiva il codice

MODULO CONFIGURATION/REMOVAL.

---

## Meccanismo di invocazione

DECISIONE RICHIESTA

---

## Contesto di esecuzione

N/A

---

## Chiamate e dipendenze

Nessuno

---

## Input

Identita' risorsa e proprietario.

---

## Output

Lease/status e stato contato di riferimento.

---

## Errori da gestire

Risorsa non supportata, fallimento della transizione, rilascio underflow/double.

---

## Non implementare ancora

- Politica della batteria, sonno profondo, fonti speculative di veglia, OTA

---

## Procedura

- [ ] Aprire solo lo schema della scheda reale, Port binding, la scheda DTS e l'hardware
      misurato.
- [ ] Identificare una risorsa di energia fisicamente controllabile, controllare la
      polarità, stato di avvio sicuro, Port interessati, limiti elettrici, e il
      comportamento misurabile on/off. Se non esiste, contrassegnare la fase BLOCKED e
      non inventare uno.
- [ ] Gestisci solo questi errori realistici: risorsa non supportata, guasto alla
      transizione, rilascio underflow/double.
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

Recensione di progettazione Ownership/reference-count.

---

## Risultato atteso

Una risorsa reale è documentata, o la fase è esplicitamente bloccata per mancanza di
hardware.

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

`power: verify controllable power hardware`

---

## Task successivo

[TASK-190-02](TASK-190-02-define-the-power-public-api.md) — Definire l’API pubblica di Power
