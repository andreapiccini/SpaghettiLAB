# S073 — Decompilatore e dry-run

**Stato:** ⬜ TODO
**Dipende da:** S072

## Obiettivo

Permettere il percorso inverso (Config live → grafo autore) e una verifica completa
prima di qualunque deploy reale.

## Implementazione richiesta

1. Implementa decompiler/import dal Config live verso un grafo funzionale, marcando ciò
   che non può recuperare metadata authoring senza inventarli.
2. Fornisci dry-run completo con elenco errori/warning e remediation per profilo o pack
   assente.

## Verifiche

- un ciclo decompile→compile su un Config supportato conserva la semantica originale;
- il decompiler non inventa mai metadata di authoring che non può recuperare (li
  lascia esplicitamente assenti);
- il dry-run elenca ogni errore/warning con remediation, senza interrompersi al primo.

## Fine task

- [ ] Decompiler e dry-run sono puri e indipendenti dalla UI.
- [ ] Un Config supportato sopravvive a un ciclo decompile→compile senza perdita
      semantica.
