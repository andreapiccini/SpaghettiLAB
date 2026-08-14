# Modalità base / avanzata — Visual

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[UI behavior](ui-behavior.md) · [Backend behavior](backend-behavior.md)

Cross-cut di shell e Settings, **non** una dodicesima schermata. Filtra la left
rail, la command palette e alcune tab interne. Dipende da S010 (shell) e S120
(Settings). Principio: nascondere l'*estensione della piattaforma* (authoring
chip, pack OTA, grafi multi-Core), non l'*uso* di un Core con i sensori del
catalogo.

## Dove vive il controllo

Due punti, stesso switch, stesso stato:

1. **Menu overflow della top bar** (`⋮`, già in `UX_ARCHITECTURE.md` § Shell):
   prima riga del menu, etichetta "Modalità avanzata" (`type.body`), switch a
   destra. Sottotitolo `type.caption` `color.ink-faint`: "Authoring profili,
   marketplace OTA, automazione multi-Core". Il menu è `radius.md`,
   `elevation.2`, sfondo `color.surface`, larghezza 280px, allineato al
   pulsante `⋮`.
2. **Settings, tab Interfaccia** (prima tab del segmented control di S120,
   prima di Credenziali): stessa etichetta e switch, riga 48px. Qui c'è
   spazio per una frase di aiuto (`type.body`, `color.ink-muted`).

Nessun terzo controllo sparso nelle schermate.

## Segmented control Settings (aggiornamento S120)

Sette voci, ordine: **Interfaccia · Credenziali · Permessi · Backup &
Versioni · Import/Export · Audit · Recovery**.

In modalità **base** il segmented control di Settings mostra solo:
**Interfaccia · Credenziali · Backup & Versioni · Import/Export**. Permessi,
Audit, Recovery restano nel progetto ma non nella chrome.

## Left rail in modalità base

Voci visibili, stessi tre gruppi (un gruppo senza voci visibili non si
disegna, né il suo separatore):

- *Composizione*: Core Connections, Physical Composition
- *Comportamento*: Processing Graph, Deploy & Diff, Runtime & Diagnostics
- *Estensioni*: Settings

Nascoste: Catalog & Topology, Device Profiles, Capability Marketplace,
Cross-Core Automation.

Le icone, misure (64px / 240px) e token restano quelli di
`UX_ARCHITECTURE.md` § Shell. Nessuna icona "lucchetto" sulle voci nascoste:
non ci sono, punto.

## Runtime (S090) in modalità base

Segmented control ridotto a **Telemetria · Comandi · Discovery**. Tab
"Stato & Risorse" e "Amministrazione" solo in avanzata.

## Badge "configurazione avanzata presente"

Se il progetto aperto contiene artifact di estensione (profilo authorato in
locale, System Automation Graph, pin OTA) e la modalità è **base**: banner
sotto la top bar, altezza 36px, sfondo `color.surface-raised`, bordo
inferiore 1px `color.border`, testo `type.caption` `color.ink-muted`:
"Questo progetto ha una configurazione avanzata." Azione testuale a destra
"Mostra" (non un bottone primario) che accende la modalità avanzata. Il
banner non è un errore (`color.error` vietato qui).

## Cosa resta visibile in base (anche se "sembra tecnico")

Connect Core, Port + Module, campo bus (`i2c_address` / `w1_rom`), Deploy,
valori live, errori comprensibili, credenziali rete. Hash, opcode e pool RAM
non compaiono in chiaro: dietro "Dettagli" o dietro il toggle avanzato.

## Stati

- **Primo avvio / chiave assente**: chrome in modalità base, switch spento.
  Nessun flash di rail avanzata.
- **Reload con `advanced` già salvato**: chrome avanzata al primo paint.
- **Switch durante una schermata nascosta**: vedi `ui-behavior.md` (redirect
  a Core Connections, nessun dialogo).
