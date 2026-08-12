# S080 — Deploy Config transazionale

**Stato:** ⬜ TODO
**Dipende da:** S073

## Obiettivo

Applicare Config in sicurezza con diff, validate, compare-and-swap, verifica e gestione
completa dei conflitti.

## Implementazione richiesta

1. Crea Deployment Coordinator per Core con pipeline compile→local validate→artifact
   resolution→remote validate→apply CAS→read-back verify.
2. Mostra diff semantico fra live, last deployed e candidate: Module/Profile/Schedule/
   Rule/Block/edge/policy; ignora metadata authoring.
3. Blocca deploy se profili o Capability Pack richiesti non sono installati; passa a
   S060/S100 mantenendo il candidate immutato e riprende solo dopo risync.
4. Usa sempre expected generation/hash. Su CONFLICT legge nuovo snapshot e offre:
   import live, rebase/merge strutturato o annulla; niente force/last-write-wins V1.
5. Mantieni DeploymentRecord soltanto dopo read-back con hash atteso; apply no-op viene
   registrato senza fingere nuova generation.
6. Gestisci disconnect/timeout/response persa interrogando Config e replay state prima
   di ritentare.
7. Preserva progetto dirty e diagnostics su qualsiasi fallimento; non assume rollback
   remoto se non osservato.
8. Supporta deploy coordinato di più Core come operazioni indipendenti con report
   parziale; V1 non promette transazione atomica distribuita.

## Verifiche

- apply riuscito, no-op, validation failure, stale generation e response persa;
- due client concorrenti non perdono modifiche;
- reboot durante apply viene riconciliato da boot ID + Config hash;
- artifact install seguito da catalog refresh ricompila lo stesso candidate;
- fallimento su Core B non falsifica lo stato di Core A.

## Fine task

- [ ] Non esiste percorso di deploy senza validate e CAS.
- [ ] Conflict resolution è strutturata e non distruttiva.
- [ ] DeploymentRecord rappresenta soltanto stato verificato.
- [ ] Errori e risultati multi-Core restano per-target.

