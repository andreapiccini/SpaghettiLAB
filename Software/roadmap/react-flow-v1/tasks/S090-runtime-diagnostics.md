# S090 — Runtime, discovery e diagnostica

**Stato:** ⬜ TODO
**Dipende da:** S030, S080

## Obiettivo

Osservare e controllare il Core live distinguendo telemetria, comandi effimeri e Config
persistente.

## Implementazione richiesta

1. Implementa subscription manager per record/event/status/discovery con cursor,
   reconnect, boot ID, sequence, drop e clock/uptime espliciti.
2. Decodifica field tramite schema/fingerprint; unknown schema conserva payload
   diagnostico e forza refresh catalogo senza interpretazione inventata.
3. Mantieni buffer host bounded per Core/schema e policy retention configurabile;
   export dati include provenienza, unità, boot ID e gap.
4. Implementa command runner catalog-driven con form tipizzato, permission check,
   correlation/result e distinzione chiara da una modifica Config.
5. Implementa discovery scan/list/accept/reject, policy invasive, job progress e
   integrazione con Physical Composition.
6. Implementa status per Module, schedule, Rule, Block, service, connectivity, health,
   reset cause, watchdog, audit e job.
7. Implementa resource monitor: flash/image headroom, RAM statica, pool/workspace/
   stack capacity-current-peak, allocation failures e limiti Config. Non mostrare una
   generica “RAM installabile”.
8. Implementa operazioni autorizzate per connectivity policy, lease, maintenance,
   credential/provisioning e reset scope con conferme per mutazioni distruttive.
9. Collega errore live al relativo Core/Module/Profile/Block quando riferimenti e
   DeploymentRecord lo permettono.

## Verifiche

- record di due Core/schema non si contaminano;
- reboot e gap sono visibili e non collegano serie incompatibili in silenzio;
- command non modifica Config/project;
- resource high-water aumenta correttamente e reset diagnostico è autorizzato;
- scan invasiva, permission denied, queue full e job timeout sono rappresentati.

## Fine task

- [ ] Ogni stato/diagnostica firmware V1 è leggibile.
- [ ] Record e perdita conservano provenienza completa.
- [ ] Comandi, Config e operazioni amministrative hanno confini distinti.
- [ ] Diagnostica risorse rispetta il significato del firmware.

