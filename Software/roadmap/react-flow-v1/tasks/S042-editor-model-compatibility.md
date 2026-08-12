# S042 — EditorModel, form e compatibility engine

**Stato:** ⬜ TODO
**Dipende da:** S041

## Obiettivo

Derivare dal catalogo/topologia normalizzati un modello editabile completo, incluso
cosa può o non può essere collegato, senza hardcodare alcun tipo concreto.

## Implementazione richiesta

1. Costruisci un `EditorModel` puro con node type, input/output handle, property
   schema, unità, enum, default, reference group, capability e permission richieste.
2. Genera form model tipizzati dai field descriptor; distingui required/default,
   integer lossless, bytes, text, enum, reference e unità fixed-point.
3. Implementa compatibility engine per handle/edge basato su schema, tipo, unità,
   semantic/reference group, direzione, Flow/Bay e capability.
4. Gestisci tipi mancanti o versione non disponibile come placeholder diagnostico che
   conserva dati e offre remediation, senza cancellare nodi.

## Verifiche

- catalog order differente produce lo stesso `EditorModel`;
- uno schema incompatibile impedisce la creazione dell'edge con errore strutturato;
- un tipo sconosciuto conserva il progetto e segnala il pack/profile richiesto invece
  di cancellare il nodo.

## Fine task

- [ ] Nessun dispositivo o blocco concreto è hardcoded nell'editor.
- [ ] Form, handle e vincoli derivano interamente dai descrittori del catalogo.
