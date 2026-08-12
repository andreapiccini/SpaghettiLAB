# S120 — Sicurezza, portabilità e recovery

**Stato:** ⬜ TODO
**Dipende da:** S010; chiusura dopo S100 e S110

## Obiettivo

Rendere progetti e operazioni sicuri, portabili e recuperabili senza perdere dati o
includere segreti negli artifact.

## Implementazione richiesta

1. Implementa credential store adapter e connection profile con riferimenti opachi;
   token/password/key non entrano in Project, Redux/devtools, log, error report o URL.
2. Definisci permission matrix locale coerente con firmware/Node-RED; l'app può
   disabilitare preventivamente ma non sostituisce enforcement remoto.
3. Implementa project autosave transazionale, version history bounded, backup prima di
   migration, crash recovery e controllo concorrenza fra tab/processi.
4. Implementa import sandboxed con schema/size limits, duplicate ID handling, unknown
   artifact preservation e preview; nessun JavaScript/plugin viene eseguito.
5. Implementa export canonico selettivo di progetto, Device Profile e diagnostica con
   redaction automatica; immagini/record live sono opt-in separati.
6. Implementa audit locale append-only per connect, validate/apply, command sensibile,
   profile install/remove, OTA, reset e Node-RED deploy; niente payload segreti.
7. Richiedi conferma target-specific per factory reset, credential removal, profile in
   uso, firmware downgrade e Node-RED resource deletion.
8. Implementa recovery guidato per Core sostituito, device ID mismatch, Config
   corrotto/assente, catalogo incompatibile, OTA rollback e Node-RED non raggiungibile.
9. Definisci retention/cache purge/logout e threat tests per XSS, malicious profile,
   oversized import, forged marketplace metadata e secret leakage.

## Verifiche

- ricerca automatica non trova segreti in export/log/audit/error;
- import malevolo non esegue codice e non esaurisce memoria;
- migration crash conserva copia recuperabile;
- tab concorrenti non corrompono Project;
- artifact non trusted/alterato è rifiutato prima di OTA;
- reset/rimozione mostrano device ID, scope e conseguenze.

## Fine task

- [ ] Credenziali e progetti hanno storage/portabilità separati.
- [ ] Tutte le operazioni sensibili sono autorizzate e auditate.
- [ ] Backup, migration e crash recovery sono provati.
- [ ] Import/marketplace non introducono codice non trusted.

