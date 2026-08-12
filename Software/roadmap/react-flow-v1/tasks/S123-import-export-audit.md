# S123 — Import/export sicuri, redaction e audit

**Stato:** ⬜ TODO
**Dipende da:** S121

## Obiettivo

Permettere di scambiare progetti, profili e diagnostica con l'esterno senza mai
eseguire contenuto non fidato o esporre segreti, e tenere traccia di ogni operazione
sensibile.

## Implementazione richiesta

1. Implementa import sandboxed con schema/size limits, duplicate ID handling, unknown
   artifact preservation e preview; nessun JavaScript/plugin viene eseguito.
2. Implementa export canonico selettivo di progetto, Device Profile e diagnostica con
   redaction automatica; immagini/record live sono opt-in separati.
3. Implementa audit locale append-only per connect, validate/apply, command sensibile,
   profile install/remove, OTA, reset e Node-RED deploy; niente payload segreti.

## Verifiche

- un import malevolo non esegue codice e non esaurisce memoria (size/schema limit);
- un artifact non trusted o alterato è rifiutato prima di poter raggiungere l'OTA
  (S103);
- l'audit log non contiene mai un payload segreto, anche per operazioni fallite.

## Fine task

- [ ] Import e marketplace non possono introdurre codice non trusted.
- [ ] Export selettivo e redaction sono verificati con test dedicati.
- [ ] Ogni operazione sensibile è auditata senza esporre segreti.
