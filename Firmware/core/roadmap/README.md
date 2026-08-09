# Backlog del firmware Spaghetti LAB

Questa cartella contiene i task eseguibili del firmware. Apri un solo task alla
volta, completa la relativa checklist e aggiorna lo stato.

## Legenda degli stati

| Simbolo | Stato |
|:---:|---|
| ⬜ | TODO |
| 🟨 | IN PROGRESS |
| ✅ | DONE |
| ⛔ | BLOCKED |

## Coerenza fra stato e checkbox

Lo stato deriva dalle checkbox presenti in `## Checklist di completamento`:

| Checklist | Stato corretto |
|---|---|
| Nessuna voce selezionata | ⬜ TODO |
| Alcune voci selezionate | 🟨 IN PROGRESS |
| Tutte le voci selezionate | ✅ DONE |

Lo stato viene aggiornato manualmente. Il validator controlla ogni task durante
la build e mostra un warning se stato e checkbox non coincidono. Non modifica
mai i file. `⛔ BLOCKED` è un'eccezione manuale ammessa anche con checklist
incompleta.

Ogni task deve rispettare questo schema:

```text
roadmap/<NNN-nome-fase>/TASK-<stesso-NNN>-<NN>-nome-task.md
```

Devono coincidere:

- ID nel nome del file;
- ID nel titolo `# TASK-NNN-NN`;
- numero nella riga `**Fase:** NNN — ...`.

Il validator segnala `TASK001` se l'identità non coincide e `TASK002` se lo
stato non rispecchia le checkbox.

L'estensione
[Markdown Checkbox Preview](https://marketplace.visualstudio.com/items?itemName=GSejas.markdown-checkbox-preview)
permette di selezionare le checkbox con il mouse. Dopo averle modificate,
aggiorna anche la riga `**Stato:**`.

## Regola obbligatoria per i concetti Zephyr

Un task che introduce per la prima volta un concetto specifico di Zephyr deve
spiegarlo **prima** della procedura. La sezione di orientamento deve indicare:

1. cos'è;
2. a cosa serve;
3. quando viene usato;
4. se opera a build-time o runtime;
5. come si collega al task;
6. qual è il file reale coinvolto;
7. cosa cercare dentro quel file;
8. cosa non modificare.

La spiegazione deve essere breve e riferita ai file reali di Spaghetti LAB.
Termini come “aggiungi il nodo”, “abilita il driver” o “usa il Device Model”
non sono istruzioni sufficienti se il concetto non è stato ancora spiegato.

## Fasi

| Stato | Fase | Risultato visibile |
|:---:|---|---|
| ✅ | [000 — Baseline](000-baseline/README.md) | Il firmware Zephyr iniziale viene compilato, caricato e osservato sulla console. |
| 🟨 | [010 — Core](010-core/README.md) | `main` avvia Core e la console mostra log strutturati. |
| ⬜ | [020 — Scheda attuale / I2C](020-board-i2c/README.md) | Il DTS generato contiene il controller I2C reale e abilitato. |
| ⬜ | [030 — Port](030-port/README.md) | Port 0 espone la capacità I2C e possiede un device Zephyr pronto. |
| ⬜ | [040 — Sezione verticale SHT40](040-sht40/README.md) | Temperatura e umidità reali compaiono nei log. |
| ⬜ | [050 — Module + Module Driver](050-module-driver/README.md) | SHT40 viene usato soltanto tramite la tabella operazioni del driver. |
| ⬜ | [060 — Driver Registry](060-driver-registry/README.md) | La ricerca di `sht40` riesce e un tipo sconosciuto fallisce correttamente. |
| ⬜ | [070 — Module Manager](070-module-manager/README.md) | Il Manager configura Port 0 come SHT40 e legge il sensore reale. |
| ⬜ | [080 — SHT40 rimovibile a runtime](080-runtime-removable-sht40/README.md) | SHT40 resta utilizzabile senza scorciatoie Devicetree specifiche del sensore. |
| ⬜ | [090 — Config interna](090-config/README.md) | Una configurazione C assegna Port 0, indirizzo SHT40 e periodo di campionamento. |
| ⬜ | [100 — Config persistente](100-storage/README.md) | La configurazione sopravvive al riavvio. |
| ⬜ | [110 — Data / zbus](110-data-zbus/README.md) | Un campione reale raggiunge logger e un secondo consumer. |
| ⬜ | [120 — Runtime V0](120-runtime-v0/README.md) | Runtime campiona ogni secondo mentre `main` esegue soltanto il boot. |
| ⬜ | [130 — Relay + Runtime V1](130-relay-runtime-v1/README.md) | Una temperatura sopra 25 °C comanda il relay configurato. |
| ⬜ | [140 — Communication](140-communication/README.md) | Un comando Shell locale legge lo stato e invia configurazioni. |
| ⬜ | [150 — CBOR](150-cbor/README.md) | Un payload CBOR viene decodificato e applicato a Config. |
| ⬜ | [160 — MQTT](160-mqtt/README.md) | Un campione raggiunge un topic MQTT configurato. |
| ⬜ | [170 — Discovery](170-discovery/README.md) | Discovery alimenta il Manager senza esporre il provider. |
| ⬜ | [180 — Varianti Core multiple](180-multi-core/README.md) | Gli stessi livelli applicativi funzionano su due varianti Core. |
| ⬜ | [190 — Power](190-power/README.md) | Una risorsa di alimentazione gestisce correttamente più proprietari e rollback. |

## Da dove iniziare

La baseline è completa. Continua dal primo task non completato della
[fase 010 — Core](010-core/README.md).
