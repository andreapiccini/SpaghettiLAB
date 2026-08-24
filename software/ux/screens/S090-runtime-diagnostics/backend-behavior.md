# Runtime & Diagnostics — Backend behavior

[← UX Architecture](../../../UX_ARCHITECTURE.md) ·
[Visual](visual.md) · [UI behavior](ui-behavior.md)

Quale dato/operazione reale alimenta ciascuna tab. Fonti: S091 (subscription
telemetria, ⬜ TODO), S092 (command runner e discovery, ⬜ TODO), S093 (stato/health/
resource monitor, ⬜ TODO), S094 (operazioni amministrative, ⬜ TODO) — nessuna ancora
implementata; questo file descrive cosa dovrebbe alimentare la schermata una volta
che lo sono, coerente con la convenzione di `roadmap/ux-v1/README.md`.

## Tab Telemetria

1. Lo stream mostra i record del subscription manager di S091 punto 1
   (record/event/status/discovery con cursor, reconnect, boot ID, sequence, drop
   e clock/uptime espliciti) — i chip boot ID/sequence in `visual.md` sono
   esattamente questi campi, mai derivati o approssimati lato UI.
2. La decodifica del valore mostrato viene da S091 punto 2 (field via
   schema/fingerprint); uno schema sconosciuto **conserva il payload
   diagnostico grezzo** e forza un refresh del catalogo, "senza interpretazione
   inventata" (S091 punto 2, garanzia esplicita) — la riga "schema sconosciuto"
   in `visual.md` mostra letteralmente questo payload grezzo, mai un tentativo
   di parsing euristico.
3. La riga di gap compare quando S091 rileva sequence non contigua o boot ID
   cambiato (S091 § Verifiche: "un reboot con boot ID cambiato rende il gap
   visibile e non collega serie incompatibili in silenzio") — non è un calcolo
   fatto lato UI, il segnale arriva già come tale dal subscription manager.
4. Buffer e retention rispettano la policy configurabile di S091 punto 3 — se lo
   stream mostra "troncato/più vecchio non disponibile", riflette esattamente
   il limite del buffer host bounded, non un limite arbitrario di rendering.
5. Un record con errore live collegato a un Core/Module/Profile/Block (quando
   riferimenti e `DeploymentRecord` lo permettono, S091 punto 4) mostra quel
   collegamento come parte del contesto del record — non descritto a parte in
   `visual.md`, ma è la stessa provenienza già visibile nei chip.

## Tab Comandi (Command runner)

1. Il catalogo comandi e il form tipizzato vengono dal command runner
   catalog-driven di S092 punto 1 — stesso principio "form deriva interamente
   dal descrittore" già usato per `EditorModel` (S042) in altre schermate, qui
   applicato ai comandi invece che ai Block.
2. "Esegui" invoca il comando con permission check (S092 punto 1) — **non
   modifica mai Config o progetto** (S092 § Verifiche, garanzia esplicita): è
   il motivo strutturale, non solo visivo, per cui questa azione non usa mai lo
   stile del pulsante "Invia a Deploy" di S080 — sono percorsi di dominio
   diversi, non solo colori diversi.
3. Gli esiti distinti (`PERMISSION_DENIED`, `QUEUE_FULL`, `JOB_TIMEOUT`, o
   successo) corrispondono uno a uno agli esiti richiesti da S092 § Verifiche:
   "permission denied, queue full e job timeout sono rappresentati con esito
   distinto, non genericamente come errore" — la UI non deve mai collassare
   questi tre casi in un badge generico "fallito".
4. Ogni esecuzione ha una correlation/result (S092 punto 1) che alimenta la
   riga nel log comandi.

## Tab Discovery

1. Scan/list/accept/reject corrispondono a S092 punto 2. Una scansione marcata
   invasiva dal catalogo **richiede l'autorizzazione esplicita prevista dalla
   policy** (S092 § Verifiche) — il dialogo di avviso in `visual.md` è quella
   autorizzazione, non un avviso puramente informativo che si può ignorare.
2. Job progress ("In corso… / Completato / Annullato") riflette lo stato reale
   del job di scansione fornito da S092 — non un progresso stimato lato client.
3. "Accetta" su un candidato si integra con Physical Composition (S050, S092
   punto 2: "integrazione con Physical Composition") — porta l'utente lì con il
   candidato precompilato, stesso principio "nessun apply automatico" già
   stabilito nel tray discovery di `UX-S050`.

## Tab Stato & Risorse

1. Ogni chip della striscia di stato corrisponde a una delle categorie
   esplicitamente elencate da S093 punto 1: Module, schedule, Rule, Block,
   service, connectivity, health, reset cause, watchdog, audit, job — "con il
   significato che ha per il firmware, non un riassunto generico" (S093 §
   Obiettivo): il testo/colore del chip non è un'interpretazione UI, riflette
   lo stato che il firmware stesso riporta.
2. Le card resource monitor mostrano esattamente le grandezze di S093 punto 2:
   flash/image headroom, RAM statica, pool/workspace/stack
   capacity-current-peak, allocation failures, limiti Config — "non mostrare
   una generica 'RAM installabile'" (S093 punto 2, divieto esplicito) è il
   motivo per cui `visual.md` impone card separate per ciascuna grandezza, mai
   un numero aggregato.
3. Il valore "peak" resta visibile anche dopo che `current` è sceso (S093 §
   Verifiche: "il resource high-water aumenta correttamente") — la card non
   nasconde né resetta il picco al render successivo.
4. "Allocation failures" resta visibile con la sua ultima occorrenza anche dopo
   che la condizione è rientrata (S093 § Verifiche: "una allocation failure
   passata è visibile anche dopo che la condizione è rientrata") — il contatore
   non torna silenziosamente invisibile a `0` eventi passati, mostra sempre
   l'ultima occorrenza nota.
5. Un "reset diagnostico" del contatore (se esposto) richiede autorizzazione
   esplicita (S093 § Verifiche) — non è un'azione a un click, riusa il pattern
   di conferma della tab Amministrazione.

## Tab Amministrazione

1. Le operazioni elencate (Connectivity policy, Lease, Maintenance,
   Credential/Provisioning, Reset scope) corrispondono esattamente a S094 punto
   1 — nessuna operazione amministrativa aggiuntiva inventata qui.
2. Ogni mutazione distruttiva richiede "conferma esplicita con target visibile
   prima di eseguire" (S094 § Verifiche) — il dialogo descritto in `visual.md`
   è quella conferma, non un `window.confirm` generico.
3. Un permesso mancante impedisce l'operazione **anche lato app**, non solo
   lato firmware (S094 § Verifiche, garanzia esplicita) — il pulsante
   disabilitato con tooltip in `visual.md` riflette questo controllo fatto
   prima di inviare qualunque richiesta al Core, non solo un rifiuto scoperto
   dopo l'invio.
