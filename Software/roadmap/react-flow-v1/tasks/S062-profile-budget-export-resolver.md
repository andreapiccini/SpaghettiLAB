# S062 — Budget locale, import/export e resolver

**Stato:** ⬜ TODO
**Dipende da:** S061

## Obiettivo

Rendere un profilo autore verificabile localmente, scambiabile come pacchetto, e capire
se un Core può accoglierlo prima di qualunque azione remota.

## Implementazione richiesta

1. Calcola localmente worst-case operation count, byte, timeout, temporanei e output;
   confronta con limiti Core prima della validate remota.
2. Implementa import/export del package profilo canonico con ID, versione, hash,
   autore, compatibilità e dipendenze opcode; non eseguire contenuto importato.
3. Implementa resolver `READY/PROFILE_INSTALL_REQUIRED/FIRMWARE_UPDATE_REQUIRED/
   HARDWARE_INCOMPATIBLE/RESOURCE_INCOMPATIBLE/VERSION_CONFLICT`.

## Verifiche

- un opcode assente propone Capability Pack e non tenta un'installazione dati;
- un profilo esportato e reimportato produce lo stesso hash;
- import di un package con dipendenze opcode dichiarate ma non installate risolve a
  `FIRMWARE_UPDATE_REQUIRED`, non a un falso `READY`.

## Fine task

- [ ] Il resolver copre tutti gli esiti definiti dall'architettura.
- [ ] Revisione/hash del pacchetto impediscono cambiamenti silenziosi.
