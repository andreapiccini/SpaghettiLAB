# Settings, Security & Recovery — UI behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [Backend behavior](backend-behavior.md)

Cosa succede nell'interfaccia **prima e indipendentemente** da qualunque chiamata al
backend. Token di movimento da `UX_ARCHITECTURE.md` § Sistema di animazione.

## Tab (segmented control)

Stesso comportamento del selettore vista di `UX-S040`: indicatore attivo scivola
con `motion.spring.snappy`, contenuto crossfade `motion.duration.base`.

## Tab Credenziali

- Dialogo "Aggiungi credenziale": stesso pattern di apertura di tutti i
  dialoghi già confermati (`motion.spring.smooth`, overlay fade
  `motion.duration.base`).
- Validazione locale (nome non vuoto, tipo selezionato, segreto non vuoto):
  bordo `color.error` + messaggio sotto il campo, prima di qualunque chiamata,
  stesso principio ovunque in questa app.
- Nuova riga credenziale dopo il salvataggio: entra con `motion.spring.bouncy`
  (elemento nuovo), il dialogo si chiude con la stessa animazione d'apertura
  invertita.
- Riga in uscita dopo rimozione confermata: fade `motion.duration.base`, le
  righe sotto scivolano su con `motion.spring.smooth`.

## Tab Permessi

Nessuna animazione particolare oltre al crossfade standard di cambio badge
(`motion.duration.base`) quando un permesso cambia stato durante la sessione
(raro, ma coerente con la regola generale "mai uno scatto secco" già applicata
ai badge di stato altrove).

## Tab Backup & Versioni

- Indicatore stato salvataggio: crossfade `motion.duration.base` fra
  "Salvato"/"Salvataggio…"/"Errore" — il pallino di "Salvataggio…" pulsa in
  opacità (1200ms loop), stesso pattern degli stati transitori altrove.
- Dialogo "Ripristina": stesso pattern di apertura standard; l'anteprima
  sintetica dentro il dialogo non ha animazioni proprie (è testo statico
  calcolato una volta all'apertura).

## Tab Import/Export

- Dialogo import: stesso pattern standard; i badge dei limiti verificati
  (schema/size) entrano con `motion.stagger.list` (30ms) man mano che ciascun
  controllo viene mostrato, non tutti insieme — comunica che sono verifiche
  distinte, non un unico check monolitico.
- Checklist export: selezionare/deselezionare una voce anima solo il proprio
  checkbox (`motion.spring.snappy`), nessun effetto sulle altre voci. La
  sezione "Escluso automaticamente" non è mai animata (è un dato fisso, non
  interattivo).

## Tab Audit

Nuove righe (se il log si aggiorna mentre la tab è aperta): `motion.stagger.list`
se arrivano in gruppo, altrimenti fade singolo `motion.duration.fast` — stesso
principio dello stream telemetria di `UX-S090`. Filtro per tipo operazione:
crossfade `motion.duration.base` sulla tabella filtrata.

## Tab Recovery

- Click su "Avvia recovery guidato": la card si comprime (`scale 0.98`,
  `motion.spring.snappy`) poi il flusso guidato entra sostituendo il contenuto
  della tab con crossfade `motion.duration.base` (cambio di contesto
  importante, non uno spring "eccitato" — stessa scelta già fatta per il
  pannello conflitto di `UX-S080`).
- Avanzamento fra step del flusso guidato: stesso stepper minimale di
  `UX-S090` § Discovery (pallino pulsante durante l'esecuzione di uno step).
- Uscita dal flusso guidato (completato o annullato): crossfade
  `motion.duration.base` di ritorno alla lista delle sei card.

## Dialoghi di conferma distruttiva

Stesso pattern di apertura standard (`motion.spring.smooth` + overlay fade).
Il pulsante di conferma che passa da disabilitato ad abilitato (quando il testo
digitato corrisponde al target) non ha animazione propria — cambia stato
immediatamente non appena il testo corrisponde, per non introdurre un ritardo
percepito su un'azione già di per sé rallentata deliberatamente dalla richiesta
di digitare il nome.

## Accessibilità del movimento

Tutte le animazioni sopra rispettano `prefers-reduced-motion` (durata 0 se attivo).
