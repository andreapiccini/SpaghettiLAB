# S040 — Catalogo, topologia e adapter React Flow

**Stato:** ⬜ TODO
**Dipende da:** S030

## Obiettivo

Derivare tutti i tipi editabili dal catalogo e dalla topologia firmware, lasciando a
React Flow soltanto il ruolo di rappresentazione e authoring.

## Implementazione richiesta

1. Normalizza catalog pages in indici immutabili per Module Driver, Rule, Block,
   opcode, Profile, operation, schema, field, command e Capability Pack.
2. Normalizza Flow, Port, Function Bay, cinque segnali, rail e admission della
   topologia senza GPIO hardcoded.
3. Costruisci un `EditorModel` puro con node type, input/output handle, property schema,
   unità, enum, default, reference group, capability e permission richieste.
4. Genera form model tipizzati dai field descriptor; distinguere required/default,
   integer lossless, bytes, text, enum, reference e unità fixed-point.
5. Implementa compatibility engine per handle/edge basato su schema, tipo, unità,
   semantic/reference group, direzione, Flow/Bay e capability.
6. Implementa adapter bidirezionale Domain↔React Flow. Gli eventi React Flow diventano
   command di dominio; node/edge non diventano fonte autorevole.
7. Gestisci tipi mancanti o versione non disponibile come placeholder diagnostico che
   conserva dati e offre remediation, senza cancellare nodi.
8. Assicura che un catalogo fake aggiunga un nuovo tipo senza modificare sorgenti UI.

## Verifiche

- catalog order differente produce lo stesso EditorModel;
- schema incompatibile impedisce edge con errore strutturato;
- rail `UNVERIFIED` non viene presentata come `ENFORCED`;
- unknown type conserva progetto e segnala pack/profile richiesto;
- test fake introduce Module/Block nuovi senza switch o componenti concreti.

## Fine task

- [ ] Nessun dispositivo/blocco concreto è hardcoded nell'editor.
- [ ] Form, handle e vincoli derivano dai descrittori.
- [ ] React Flow adapter non contiene protocollo o validazione firmware.
- [ ] Catalogo/topologia parziali non producono un modello apparentemente valido.

