# S091 — Subscription telemetria, decodifica e buffering

**Stato:** ⬜ TODO
**Dipende da:** S030, S080

## Obiettivo

Ricevere e rendere interrogabile la telemetria del Core, con provenienza e perdite
sempre esplicite.

## Implementazione richiesta

1. Implementa subscription manager per record/event/status/discovery con cursor,
   reconnect, boot ID, sequence, drop e clock/uptime espliciti.
2. Decodifica field tramite schema/fingerprint; unknown schema conserva payload
   diagnostico e forza refresh catalogo senza interpretazione inventata.
3. Mantieni buffer host bounded per Core/schema e policy retention configurabile;
   export dati include provenienza, unità, boot ID e gap.
4. Collega errore live al relativo Core/Module/Profile/Block quando riferimenti e
   DeploymentRecord lo permettono.

## Verifiche

- record di due Core/schema distinti non si contaminano nello stesso buffer;
- un reboot con boot ID cambiato rende il gap visibile e non collega serie
  incompatibili in silenzio;
- un unknown schema conserva il payload grezzo invece di scartarlo o interpretarlo a
  caso.

## Fine task

- [ ] Ogni record/evento conserva provenienza completa (Core, schema, boot ID, unità).
- [ ] Perdite e gap sono sempre espliciti, mai silenziosi.
