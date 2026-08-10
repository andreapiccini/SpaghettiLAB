# Backlog del firmware Spaghetti LAB

Questa cartella contiene i task eseguibili del firmware. Apri un solo task alla
volta, completa la relativa checklist e aggiorna lo stato.

> [!IMPORTANT]
> La relazione corretta è Port 1:N Module. Leggi il
> [report di migrazione](PORT-MODULE-1-N-MIGRATION.md) prima di riprendere la fase 050.

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

Lo stato viene aggiornato manualmente. I task non fanno parte della compilazione e
quindi non vengono scanditi dal validator durante `make build`. Per controllarli usa
`./validator roadmap`; verrà mostrato un warning se stato e checkbox non coincidono.
Il validator non modifica mai i file. `⛔ BLOCKED` è un'eccezione manuale ammessa anche
con checklist incompleta.

La roadmap contiene un task autosufficiente per fase. Ogni task deve rispettare questo schema:

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
| ✅ | [010 — Core](010-core/README.md) | `main` avvia Core e la console mostra log strutturati. |
| ✅ | [020 — Scheda attuale / I2C](020-board-i2c/README.md) | Il DTS generato contiene il controller I2C reale e abilitato. |
| ✅ | [030 — Port](030-port/README.md) | Port 0 espone la capacità I2C e possiede un device Zephyr pronto. |
| ✅ | [040 — Sezione verticale INA219](040-ina219/README.md) | Bus voltage, current e power reali compaiono nei log. |
| ⬜ | [050 — Module + Module Driver](050-module-driver/README.md) | Module distingue key, ID runtime, Port ed endpoint; INA219 usa la operation table. |
| ⬜ | [060 — Driver Registry](060-driver-registry/README.md) | La ricerca di `ina219` riesce e un tipo sconosciuto fallisce correttamente. |
| ✅ | [070 — Module Manager](070-module-manager/README.md) | Il Manager gestisce più endpoint simultanei sulla stessa Port. |
| ✅ | [080 — INA219 rimovibile a runtime](080-runtime-removable-ina219/README.md) | Due INA219 condividono Port 0 con address e context runtime distinti. |
| ⬜ | [090 — Config interna](090-config/README.md) | Config riconcilia Module per key e accetta Port ripetute con endpoint distinti. |
| ⬜ | [100 — Config persistente](100-storage/README.md) | La configurazione sopravvive al riavvio. |
| ⬜ | [110 — Data / zbus](110-data-zbus/README.md) | Bus voltage/current/power raggiungono due consumer. |
| ⬜ | [120 — Runtime V0](120-runtime-v0/README.md) | Runtime campiona ogni secondo mentre `main` esegue soltanto il boot. |
| ⬜ | [130 — Relay + Runtime V1](130-relay-runtime-v1/README.md) | Una soglia di corrente con isteresi comanda il relay configurato. |
| ⬜ | [140 — Communication](140-communication/README.md) | Un comando Shell locale legge lo stato e invia configurazioni. |
| ⬜ | [150 — CBOR](150-cbor/README.md) | Un payload CBOR viene decodificato e applicato a Config. |
| ⬜ | [160 — MQTT](160-mqtt/README.md) | Il campione elettrico raggiunge il topic MQTT configurato. |
| ⬜ | [170 — Discovery](170-discovery/README.md) | Discovery emette più risultati per Port e invalida una key alla volta. |
| ⬜ | [180 — Varianti Core multiple](180-multi-core/README.md) | Gli stessi livelli applicativi funzionano su due varianti Core. |
| ⬜ | [190 — Power](190-power/README.md) | Una risorsa di alimentazione gestisce correttamente più proprietari e rollback. |
| ⬜ | [200 — Engine completo](200-engine/README.md) | Il Core carica Config, avvia i componenti e accetta riconfigurazioni senza reboot. |
| ⬜ | [210 — Finalizzazione](210-finalizzazione/README.md) | Nessuna scorciatoia temporanea rimane e il sistema completo supera la matrice end-to-end. |

## Da dove iniziare

Le fasi 000–040 sono complete. Apri ora
[TASK-050-01 — Introdurre Module e Module Driver](050-module-driver/TASK-050-01-introdurre-module-e-driver.md).
