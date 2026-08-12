# Settings, Security & Recovery — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Credenziali, permessi, backup/import/export e recovery guidato. Usa la shell a tre
colonne standard (`UX_ARCHITECTURE.md` § Shell applicativa) — voce attiva nel left
rail: `Settings` / "Settings & Security". Nessun Inspector: ogni dettaglio vive in
linea o in dialoghi dedicati. Dipende da S121–S124. **Questa schermata applica per
prima** la convenzione "conferme distruttive" di `UX_ARCHITECTURE.md` § Convenzioni
cross-cutting.

## Header di schermata

- Altezza 56px, `border-bottom: 1px solid color.border`, sfondo `color.surface`,
  padding orizzontale `space.4`, titolo "Settings, Security & Recovery"
  (`type.heading`).
- **Segmented control**, sei voci: **Credenziali · Permessi · Backup & Versioni ·
  Import/Export · Audit · Recovery**.

## Tab Credenziali

- Lista righe, 48px, `radius.sm`, bordo 1px `color.border`: chip icona
  (`KeyRound` 20px, sfondo `color.ink-faint` 12%), nome credenziale
  (`type.body-strong`), tipo (`type.caption`, es. "API key" / "Password" /
  "Certificato"), **riferimento opaco** (`font.mono` 12px `color.ink-faint`, es.
  `cred://mqtt-broker-01`) — **mai il valore del segreto, in nessuno stato,
  anche dopo il salvataggio**.
- `margin-left: auto`: pulsante "Rimuovi" (bordo `color.error`, apre conferma
  distruttiva — vedi § Conferme distruttive).
- "+ Aggiungi credenziale" → dialogo (`radius.lg`, `elevation.3`): campo Nome,
  select Tipo, campo Segreto (`type="password"`, mascherato, mai un'icona
  "mostra password" — il valore non deve mai tornare leggibile in chiaro nella
  UI, nemmeno durante l'inserimento oltre la mascheratura standard del
  browser). Dopo il salvataggio il dialogo si chiude e la riga compare con solo
  il riferimento — **non esiste alcuna vista "modifica" che ripopoli il campo
  segreto con un valore esistente**: modificare una credenziale significa
  sempre inserirne una nuova.

## Tab Permessi

**Matrice permessi locale**, righe = operazione, raggruppate per area (Core:
connetti/comando/OTA; Node-RED: deploy/gestione; Progetto: import/export):

- Riga 40px: nome operazione (`type.body`), badge esito a destra:
  - Consentita: pillola `color.success` 12%, "Consentita".
  - **Permesso mancante**: pillola `color.ink-faint` 12%, icona `Lock` 12px,
    "Permesso mancante" — **visivamente distinto** da un errore di rete/
    connessione (che userebbe `color.error` con icona `CircleAlert`, coerente
    con lo stato `ERROR` di sessione già definito in `UX-S030`): un permesso
    negato è una condizione nota e stabile, non un guasto.
  - Hover sulla riga "Permesso mancante": tooltip che spiega quale ruolo/scope
    servirebbe.

## Tab Backup & Versioni

- **Indicatore stato salvataggio** (in alto, non un'intera sezione — pillola
  compatta): "Salvato" (`color.success`, icona `Check`) / "Salvataggio…"
  (`color.info`, pallino pulsante) / "Errore salvataggio" (`color.error`, icona
  `CircleAlert` + azione "Riprova").
- **Cronologia versioni**: lista righe 44px, timestamp (`type.body`),
  dimensione (`type.caption` `color.ink-faint`), pulsante "Ripristina"
  (bordo `color.border-strong`) — click apre un dialogo di conferma leggero
  (non il pattern "distruttivo" completo: qui non c'è perdita permanente,
  la versione corrente resta comunque nella cronologia dopo il ripristino) con
  anteprima sintetica di cosa cambierebbe.

## Tab Import/Export

Stesso principio "mai un'importazione silenziosa" già stabilito in `UX-S010`/
`UX-S060`, qui esteso a progetto/Device Profile/diagnostica:

- **Import**: dialogo con anteprima obbligatoria prima di "Importa" — mostra
  limiti schema/size verificati (badge `color.success`/`color.error` per
  ciascun limite), gestione ID duplicati (elenco "questi ID esistono già:
  verranno rinominati" — mai un sovrascrivere silenzioso), e badge
  "artifact sconosciuti preservati: {N}" quando l'import contiene tipi non
  riconosciuti (coerente col placeholder diagnostico di `UX-S040`: mai
  scartati).
- **Export selettivo**: checklist (Progetto / Device Profile / Diagnostica),
  ciascuna con sotto-elenco di cosa è incluso. **Sezione "Escluso
  automaticamente"** sempre visibile e non disattivabile: credenziali, record
  live — testo esplicito, es. "3 credenziali escluse (mai esportabili)". Sotto,
  due checkbox **separate e deselezionate di default**, marcate "opt-in
  esplicito": "Includi immagini" / "Includi record live più recenti" — l'utente
  deve attivarle consapevolmente, non sono nella selezione automatica.

## Tab Audit

Tabella sola lettura, append-only (nessuna azione di modifica/eliminazione
disponibile su nessuna riga): colonne Timestamp (`font.mono`), Operazione
(connect/validate-apply/comando sensibile/profile install-remove/OTA/reset/
Node-RED deploy), Target (`type.mono`), Esito (badge success/error). **Nessuna
colonna o dettaglio espanso mostra mai un payload segreto**, anche per righe con
esito fallito. Filtro per tipo operazione (chip multi-select).

## Tab Recovery

Sei card fisse, una per scenario, `radius.md`, bordo 1px `color.border`, icona
32px dedicata, titolo, descrizione breve, pulsante "Avvia recovery guidato":

| Scenario | Icona |
|---|---|
| Core sostituito | `Replace` |
| Device ID mismatch | `FingerprintX` (fallback: `ShieldAlert`) |
| Config corrotto/assente | `FileWarning` |
| Catalogo incompatibile | `PackageX` |
| OTA rollback | `RotateCcw` |
| Node-RED irraggiungibile | `CloudOff` |

Click apre un **flusso guidato dedicato per scenario** (stepper minimale, stile
coerente con lo stepper di scansione di `UX-S090`, non lo stepper a 6 tappe di
S080) — **mai un unico pulsante "riprova" generico condiviso fra scenari
diversi**.

## Conferme distruttive (pattern comune a tutta la schermata)

Applicato a: rimozione credenziale, factory reset, rimozione profilo in uso,
downgrade firmware, rimozione risorsa Node-RED — stesso dialogo per tutti,
coerente con `UX_ARCHITECTURE.md` § Convenzioni cross-cutting:

- `elevation.3`, titolo che nomina il target esplicito (es. "Rimuovere la
  credenziale `mqtt-broker-01`?", mai "sei sicuro?").
- Corpo: **device ID, scope e conseguenze mostrati per intero prima della
  conferma** (es. per un factory reset: "Questo cancellerà Config, profili e
  credenziali locali del Core `core-greenhouse-01` (device ID
  `A3F1…`). Questa azione non è reversibile.").
- Pulsante di conferma `color.error`.
- **Azioni con impatto multi-Core** (es. rimozione di una credenziale usata da
  più Core, downgrade che tocca un gruppo): campo testo "scrivi `{nome
  target}` per confermare", pulsante di conferma disabilitato finché il testo
  non corrisponde esattamente.
