# S102 — Preflight e budget risorse

**Stato:** ⬜ TODO
**Dipende da:** S101, S093

## Obiettivo

Decidere se un candidato Capability Pack può essere installato in sicurezza su un Core
specifico, prima di trasferire qualunque byte.

## Implementazione richiesta

1. Implementa preflight candidato: trusted source, firma/hash metadata, variante,
   profile, slot/layout, downgrade, bootloader, Config/profile compatibility e budget.
2. Confronta flash/RAM/stack/pool/workspace manifest con capacità build; mostra delta e
   margini, senza usare RAM libera corrente come prova.
3. Permetti build `all-supported` quando il manifest entra; altrimenti seleziona
   immagini composte già firmate. La V1 non compila firmware nel browser.

## Verifiche

- un profilo dati installabile (S063) non fa mai scattare un preflight OTA;
- un manifest che eccede la capacità dichiarata dal build blocca il preflight con il
  delta esplicito, non con un generico "non c'è spazio";
- un artifact non trusted o con hash non corrispondente è rifiutato prima del
  trasferimento.

## Fine task

- [ ] Il preflight verifica compatibilità e risorse per ogni candidato.
- [ ] La build selezionata (all-supported o composta) è sempre firmata.
