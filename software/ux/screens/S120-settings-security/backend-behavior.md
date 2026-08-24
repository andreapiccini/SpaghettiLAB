# Settings, Security & Recovery — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale comando/operazione parte davvero per ciascuna azione descritta in
`ui-behavior.md`. Fonti: S121 (credential store e permission matrix, ⬜ TODO), S122
(persistenza robusta, ⬜ TODO), S123 (import/export sicuri, redaction e audit, ⬜
TODO), S124 (conferme distruttive, recovery guidato e threat test, ⬜ TODO) —
nessuna ancora implementata; questo file descrive cosa dovrebbe partire una volta
che lo sono, coerente con la convenzione di `roadmap/ux-v1/README.md`.

## Tab Credenziali

1. "Aggiungi credenziale" scrive nel credential store adapter di S121 punto 1
   con **riferimento opaco** — il valore del segreto "non entra in Project,
   Redux/devtools, log, error report o URL" (S121 punto 1, garanzia esplicita a
   livello di dominio, non solo di UI): è per questo che nessuna vista di
   modifica in `visual.md` può mai ripopolare il campo segreto, il dato non è
   nemmeno recuperabile dallo stato applicativo per farlo.
2. S121 § Verifiche: "una ricerca automatica su export/log/audit/error non
   trova mai un segreto" — è la garanzia dietro sia questa tab sia la tab
   Audit sotto.
3. "Rimuovi" invoca la rimozione del riferimento dal credential store, dietro
   la conferma distruttiva standard (vedi § Conferme distruttive).

## Tab Permessi

1. Il badge "Permesso mancante" riflette la permission matrix locale di S121
   punto 2, "coerente con firmware/Node-RED" — "l'app può disabilitare
   preventivamente ma non sostituisce enforcement remoto" (S121 punto 2,
   limite esplicito): la UI comunica solo cosa è già noto localmente, un'azione
   consentita qui può comunque essere rifiutata dal Core/Node-RED al momento
   reale — nessuna promessa di enforcement lato app.
2. S121 § Verifiche: "un'operazione senza permesso è disabilitata lato app
   prima ancora di essere tentata lato Core/Node-RED" — coerente con lo stesso
   principio già applicato alle operazioni amministrative in `UX-S090`.

## Tab Backup & Versioni

1. L'indicatore di stato salvataggio riflette l'autosave transazionale di S122
   punto 1 — "un salvataggio interrotto non lascia un file a metà" (S122 §
   Verifiche): lo stato "Errore salvataggio" non lascia mai un progetto a metà
   scritto, per costruzione del meccanismo sottostante, non per una verifica
   fatta dalla UI.
2. La cronologia versioni è la version history bounded di S122 punto 1;
   "Ripristina" usa lo stesso meccanismo di backup pre-migration/crash recovery
   — "un crash durante una migration conserva una copia recuperabile del
   progetto" (S122 § Verifiche) è la garanzia che rende sicuro mostrare e usare
   questa lista anche subito dopo un errore.
3. Se due schede sono aperte sullo stesso progetto, il controllo di concorrenza
   di S122 punto 1 impedisce la corruzione ("due tab concorrenti sullo stesso
   progetto non lo corrompono", S122 § Verifiche) — non descritto come UI a
   parte in `visual.md` perché è una garanzia di dominio, non un'interazione
   visibile finché non emerge un conflitto reale da comunicare.

## Tab Import/Export

1. L'anteprima import (limiti schema/size, ID duplicati, artifact sconosciuti
   preservati) viene dall'import sandboxed di S123 punto 1 — "nessun
   JavaScript/plugin viene eseguito" (S123 punto 1, garanzia esplicita) è il
   motivo per cui l'anteprima è sempre possibile in sicurezza anche per un file
   non fidato, prima di qualunque conferma. S123 § Verifiche: "un import
   malevolo non esegue codice e non esaurisce memoria (size/schema limit)".
2. L'export selettivo con redaction automatica (credenziali, record live
   esclusi di default) viene da S123 punto 2 — "immagini/record live sono
   opt-in separati" (S123 punto 2) è esattamente il motivo per cui quelle due
   checkbox in `visual.md` sono deselezionate di default e separate dalla
   selezione automatica.

## Tab Audit

1. Le righe vengono dall'audit locale append-only di S123 punto 3, che copre
   esattamente: connect, validate/apply, comando sensibile, profile
   install/remove, OTA, reset, Node-RED deploy — nessuna categoria di
   operazione aggiuntiva inventata dalla UI.
2. "Niente payload segreti" (S123 punto 3, garanzia esplicita) — S123 §
   Verifiche: "l'audit log non contiene mai un payload segreto, anche per
   operazioni fallite" — questa garanzia vale anche per le righe con `Esito`
   fallito, non solo per quelle riuscite.

## Tab Recovery

Ciascuno dei sei flussi guidati corrisponde a uno scenario esplicito di S124
punto 2 ("recovery guidato per Core sostituito, device ID mismatch, Config
corrotto/assente, catalogo incompatibile, OTA rollback e Node-RED non
raggiungibile") — S124 § Verifiche: "ogni scenario di recovery guidato ha un
percorso testato **senza azioni distruttive implicite**": nessuno step di
questi flussi esegue un'azione irreversibile senza passare comunque dal
pattern di conferma distruttiva standard quando applicabile.

## Conferme distruttive

1. Fattory reset, rimozione credenziale, rimozione profilo in uso, downgrade
   firmware, rimozione risorsa Node-RED corrispondono esattamente alle cinque
   operazioni di S124 punto 1 — nessuna aggiuntiva, nessuna omessa.
2. "Ogni reset o rimozione mostra device ID, scope e conseguenze prima della
   conferma" (S124 § Verifiche) — è esattamente il corpo del dialogo descritto
   in `visual.md`, non un riassunto generico "questa azione è irreversibile".
3. Le protezioni sottostanti (S124 punto 3: retention/cache purge/logout e
   threat test per XSS, profilo malevolo, import oversize, metadata
   marketplace forgiati, secret leakage) non sono visibili come UI a parte —
   sono garanzie di sicurezza che rendono sicure le superfici già descritte
   sopra (import, credenziali, audit), verificate da S124 § Verifiche: "i
   threat test sono automatizzati e passano".
