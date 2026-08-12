# Capability Marketplace & OTA — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale dato/operazione reale alimenta ciascuna tab. Fonti: S101 (marketplace catalog
e dependency resolver, ⬜ TODO), S102 (preflight e budget risorse, ⬜ TODO), S103
(state machine OTA, postflight e audit, ⬜ TODO) — nessuna ancora implementata;
questo file descrive cosa dovrebbe alimentare la schermata una volta che lo sono,
coerente con la convenzione di `roadmap/ux-v1/README.md`.

## Tab Marketplace

1. Le tre liste (Disponibili/Installati/Richiesti) leggono rispettivamente
   marketplace available catalog, Core installed feature catalog e Project
   required artifacts — "mantieni separati" (S101 punto 2) è una garanzia
   esplicita del modello dati, non solo una scelta di layout: le tre fonti non
   vengono mai fuse in un'unica interrogazione.
2. Il provider marketplace è un indice locale o HTTPS firmato (S101 punto 1) —
   il badge "Verificato"/"Locale" in `visual.md` riflette esattamente
   `firma/trust` del modello pack, mai un'assunzione fatta dalla UI.
3. Il campo "richiesto da" di una card in "Richiesti dal progetto" viene dal
   collegamento fra Project required artifacts e la sorgente reale del
   requisito (es. un Block nel Processing Graph) — S101 § Verifiche conferma il
   caso concreto: "un Block Kalman assente risolve al pack/artifact corretto
   con motivazione esplicita".

## Tray dettaglio pack — dependency resolver

1. Le righe "Dipendenze" vengono dal dependency resolver deterministico di
   S101 punto 3 — "nessuna dipendenza implicita scaricata dopo conferma" (S101
   punto 3, garanzia esplicita): "Installa" richiede sempre revisione esplicita
   dell'elenco mostrato, non un download automatico di dipendenze aggiuntive
   non elencate.
2. Ogni esito (soddisfatta/conflitto/incompatibilità) porta sempre una
   motivazione (S101 punto 3: "motivazione per ogni selezione, conflitto o
   incompatibilità") — coerente con S101 § Verifiche: "un pack Modbus con
   dipendenza incompatibile fallisce la risoluzione prima di qualunque
   trasferimento" — nessun byte viene trasferito finché il resolver non ha
   dato esito.

## Tab Preflight

1. Un profilo dati installabile (S063, già usato in `UX-S060`) **non fa mai
   scattare questo preflight OTA** (S102 § Verifiche) — questa tab si attiva
   solo per candidati che richiedono un vero aggiornamento firmware, mai per
   l'installazione dati di un Device Profile.
2. La checklist copre esattamente le verifiche di S102 punto 1: trusted
   source, firma/hash metadata, variante, profile, slot/layout, downgrade,
   bootloader, compatibilità Config/profile — nessuna voce aggiuntiva inventata
   dalla UI, nessuna omessa.
3. La tabella budget confronta manifest con capacità build (S102 punto 2), "senza
   usare RAM libera corrente come prova" (S102 punto 2, divieto esplicito) — è
   il motivo strutturale, non solo visivo, per cui `visual.md` non include mai
   una colonna "RAM libera ora".
4. Un manifest che eccede la capacità build blocca il preflight con "il delta
   esplicito, non un generico 'non c'è spazio'" (S102 § Verifiche) — la colonna
   "Margine" in `visual.md` è quel delta.
5. Un artifact non trusted o con hash non corrispondente è rifiutato **prima
   del trasferimento** (S102 § Verifiche) — la voce checklist corrispondente
   blocca il pulsante "Avvia OTA" prima che qualunque byte parta.
6. La build selezionata è sempre firmata: `all-supported` se il manifest entra,
   altrimenti un'immagine composta già firmata (S102 punto 3) — "la V1 non
   compila firmware nel browser" (S102 punto 3, garanzia esplicita): non esiste
   nella UI alcuna opzione di build custom lato client.

## Tab Aggiornamento (OTA)

1. Lo stepper corrisponde 1:1 alla state machine di S103 punto 1:
   `arm/upload/progress/finalize/reboot/trial/confirm/rollback/cancel` — "resume
   soltanto se il protocollo lo garantisce" (S103 punto 1): se una tappa non è
   ripristinabile dopo una disconnessione, la UI mostra lo stato reale riportato
   (es. "riprendi da capo"), mai un resume ottimistico non garantito.
2. Dopo il reboot, prima di considerare l'update "installato", S103 punto 2
   verifica device ID, firmware version, feature-set hash, pack list,
   Config/profile preservation, catalog fingerprint e resource report — la
   tappa "Prova" nello stepper resta attiva finché questa verifica non è
   completata, mai marcata "riuscita" in anticipo.
3. Un'immagine che rimuoverebbe una feature usata dal Config/progetto è
   rifiutata prima di avviare l'OTA (S103 punto 3, S103 § Verifiche: "la
   rimozione di una feature in uso è rifiutata prima di avviare l'OTA") — se
   applicabile, questo blocco compare già in Preflight, non a metà OTA.
4. Il countdown "Prova" e il pulsante "Conferma aggiornamento"/"Rollback
   manuale" guidano l'utente attraverso il periodo di trial di S103 —
   "disconnect, hash errato, power loss simulata, trial crash e rollback
   preservano sempre Config e profili esistenti" (S103 § Verifiche) è
   esattamente il messaggio mostrato nel banner Rollback di `visual.md`, non
   una promessa generica di rassicurazione.
5. Dopo un OTA riuscito, un fingerprint refresh del catalogo invalida la cache
   coerentemente con S030 (S103 § Verifiche) — il Catalog & Topology Explorer
   (`UX-S040`) rifletterà questo cambiamento alla successiva sincronizzazione,
   non richiede un'azione separata qui.
6. L'audit OTA mostrato in fondo alla tab conserva la cronologia "senza token,
   chiavi o URL firmati sensibili" (S103 punto 4, divieto esplicito) — nessun
   campo dell'audit log in `visual.md` espone questi valori, per costruzione.
