# S124 — Conferme distruttive, recovery guidato e threat test

**Stato:** ⬜ TODO
**Dipende da:** S122, S123; chiusura dopo S103 e S113

## Obiettivo

Chiudere la qualificazione di sicurezza: ogni azione irreversibile è confermata
esplicitamente, e ogni scenario di guasto ha un percorso di recupero guidato.

## Implementazione richiesta

1. Richiedi conferma target-specific per factory reset, credential removal, profile in
   uso, firmware downgrade e Node-RED resource deletion.
2. Implementa recovery guidato per Core sostituito, device ID mismatch, Config
   corrotto/assente, catalogo incompatibile, OTA rollback e Node-RED non raggiungibile.
3. Definisci retention/cache purge/logout e threat test per XSS, malicious profile,
   oversized import, forged marketplace metadata e secret leakage.

## Verifiche

- ogni reset o rimozione mostra device ID, scope e conseguenze prima della conferma;
- i threat test (XSS, profilo malevolo, import oversize, metadata marketplace forgiati,
  secret leakage) sono automatizzati e passano;
- ogni scenario di recovery guidato (Core sostituito, ID mismatch, Config
  corrotto/assente, catalogo incompatibile, rollback, Node-RED irraggiungibile) ha un
  percorso testato senza azioni distruttive implicite.

## Fine task

- [ ] Tutte le operazioni sensibili richiedono conferma target-specific.
- [ ] Ogni scenario di recovery guidato previsto dall'architettura è testato.
- [ ] I threat test definiti sono automatizzati e passano.
