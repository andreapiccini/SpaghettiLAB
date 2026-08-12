# S013 — I tre grafi e i confini fra layer

**Stato:** ⬜ TODO
**Dipende da:** S012

## Obiettivo

Definire i tre modelli distinti dell'architettura e impedire che si mescolino fra loro
o con i metadati di authoring.

## Implementazione richiesta

1. Definisci i tre modelli distinti: Physical Composition, Device Processing e System
   Automation Graph. Rifiuta riferimenti fra layer non consentiti.
2. Separa authoring metadata da dati deployabili: coordinate, viewport, selezione,
   commenti e grouping non entrano mai nel Config firmware.

## Verifiche

- un riferimento creato fra layer non consentiti (es. Device Processing → System
  Automation) è rifiutato con errore strutturato (da S012);
- rimuovere/alterare i soli metadati di authoring non cambia l'identità né il contenuto
  deployabile delle entità di dominio.

## Fine task

- [ ] I tre grafi hanno ownership separata e non condividono serializzazione.
- [ ] Nessun metadato di authoring può raggiungere il Config firmware.
