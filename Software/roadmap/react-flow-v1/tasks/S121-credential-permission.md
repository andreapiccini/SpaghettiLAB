# S121 — Credential store e permission matrix

**Stato:** ⬜ TODO
**Dipende da:** S014

## Obiettivo

Garantire fin dalle fondamenta che nessun segreto possa finire in un progetto, log o
errore, e che i permessi siano verificati prima di mostrare un'operazione.

## Implementazione richiesta

1. Implementa credential store adapter e connection profile con riferimenti opachi;
   token/password/key non entrano in Project, Redux/devtools, log, error report o URL.
2. Definisci permission matrix locale coerente con firmware/Node-RED; l'app può
   disabilitare preventivamente ma non sostituisce enforcement remoto.

## Verifiche

- una ricerca automatica su export/log/audit/error non trova mai un segreto;
- un'operazione senza permesso è disabilitata lato app prima ancora di essere tentata
  lato Core/Node-RED.

## Fine task

- [ ] Credenziali e progetti hanno storage e portabilità separati.
- [ ] La permission matrix locale è coerente con l'enforcement remoto, senza
      sostituirlo.
