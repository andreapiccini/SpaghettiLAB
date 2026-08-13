# Fase 391 — Validazione remota reale dei Device Profile

[← Indice del backlog](../README.md)

**Stato:** ⬜ TODO

## Obiettivo

Fare in modo che `VALIDATE_DEVICE_PROFILE` esegua davvero
`spaghetti_device_profile_validate` sul profilo ricevuto, invece di limitarsi a
controllare che il payload non sia vuoto.

## Perché è una fase separata

Scoperto durante l'implementazione lato Software di S063 (`Software/roadmap/react-flow-v1/tasks/S063-profile-install-catalog-sources.md`):
`execute_validate_device_profile`
(`subsys/communication/operations/device_profile_ops.c`) è uno stub — decodifica il
`bstr` in ingresso, controlla che non sia vuoto, e risponde sempre `valid: 1`. Non
chiama mai `spaghetti_device_profile_validate`, quindi un profilo con opcode
sconosciuto, temp slot fuori range, `WAIT_FIELD_MASK` non bounded o schema incoerente
risulta "valido" a questa chiamata anche quando `INSTALL_DEVICE_PROFILE` lo rifiuterà
subito dopo.

Non blocca nulla oggi: `@spaghettilab/device-profile-install` (lato Software) tratta già
questa chiamata come non affidabile e si affida solo alla verifica dell'hash
post-installazione come segnale di correttezza reale — vedi il commento su
`installProfile()` in quel pacchetto. Ma restava un buco funzionale non tracciato da
nessuna parte: né una nota nella fase 360 (che ha introdotto l'operazione, già ✅ DONE),
né un TODO nel codice. Isolato qui come fase a sé — dopo la 390 — perché la 360 resta
correttamente chiusa così com'è (l'operazione esiste ed è funzionale al wire, solo non
valida davvero) e perché completarla non richiede riaprire nessun contratto V1 già
congelato.

## Task

1. ⬜ Far chiamare a `execute_validate_device_profile` la decodifica CBOR completa
   (`decode_profile_cbor`) seguita da `spaghetti_device_profile_validate`, restituendo
   `valid: 0` con motivo strutturato (stesso stile di `VALIDATE_CONFIG`'s
   `failureField`/`failureIndex`/`failureReason`) invece di `valid: 1` fisso.
2. Verificare che un profilo con opcode sconosciuto, temp slot fuori range o budget
   superato fallisca `VALIDATE_DEVICE_PROFILE` prima di qualunque tentativo di
   `INSTALL_DEVICE_PROFILE`.

## Criteri di completamento della fase

- [ ] `VALIDATE_DEVICE_PROFILE` chiama il validatore reale, non un controllo di
      non-vuotezza.
- [ ] Un profilo malformato viene rifiutato da `VALIDATE_DEVICE_PROFILE` con lo stesso
      esito che avrebbe da `INSTALL_DEVICE_PROFILE`.
- [ ] `Software/micro-flow-editor/packages/device-profile-install`'s README aggiorna la
      nota "known stub" una volta chiusa questa fase.
