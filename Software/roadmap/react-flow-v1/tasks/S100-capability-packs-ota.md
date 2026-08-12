# S100 — Capability Pack, marketplace funzionale e OTA

**Stato:** ⬜ TODO
**Dipende da:** S060, S080, S090

## Obiettivo

Risolvere feature firmware mancanti mediante un catalogo di pack e immagini firmate,
senza confondere installazione dati e aggiornamento firmware.

## Implementazione richiesta

1. Implementa provider marketplace V1 da indice locale o HTTPS firmato. Il modello
   contiene pack ID/versione, dipendenze/conflitti, artifact, hash, firma/trust,
   Core/profile/layout, ABI/Protocol/Config, tipi forniti e resource manifest.
2. Mantieni separati marketplace available catalog, Core installed feature catalog e
   Project required artifacts.
3. Implementa dependency resolver deterministico con motivazione per ogni selezione,
   conflitto o incompatibilità; nessuna dipendenza implicita scaricata dopo conferma.
4. Implementa preflight candidato: trusted source, firma/hash metadata, variante,
   profile, slot/layout, downgrade, bootloader, Config/profile compatibility e budget.
5. Confronta flash/RAM/stack/pool/workspace manifest con capacità build; mostra delta e
   margini, senza usare RAM libera corrente come prova.
6. Implementa OTA state machine arm/upload/progress/finalize/reboot/trial/confirm/
   rollback/cancel per ogni trasporto supportato e resume soltanto se il protocollo lo
   garantisce.
7. Dopo reboot verifica device ID, firmware version, feature-set hash, pack list,
   Config/profile preservation, catalog fingerprint e resource report prima di
   considerare installato.
8. Rifiuta immagine che rimuove una feature usata dal Config/progetto, salvo migration
   esplicita supportata e previewata.
9. Permetti build `all-supported` quando il manifest entra; altrimenti seleziona
   immagini composte già firmate. La V1 non compila firmware nel browser.
10. Conserva audit di update senza token, chiavi o URL firmati sensibili.

## Verifiche

- profilo dati installabile non avvia OTA;
- blocco Kalman assente risolve pack/artifact corretto e poi diventa configurabile;
- Modbus con dipendenza incompatibile fallisce prima del trasferimento;
- disconnect, hash errato, power loss fake, trial crash e rollback preservano Config;
- rimozione feature in uso è rifiutata e fingerprint refresh invalida cache.

## Fine task

- [ ] Marketplace funzionale copre discovery, resolution e artifact retrieval.
- [ ] Solo immagini firmware firmate aggiungono codice al Core.
- [ ] Preflight e postflight verificano compatibilità e risorse.
- [ ] OTA failure/rollback non produce stato “installato” falso.

