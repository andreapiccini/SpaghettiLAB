# S063 — Installazione, catalogo e sorgenti profilo

**Stato:** ⬜ TODO
**Dipende da:** S062

## Obiettivo

Portare un profilo risolto fino a un Module realmente istanziabile sul Core, da
qualunque sorgente provenga.

## Implementazione richiesta

1. Implementa validate remota, installazione atomica, verifica hash post-install e
   rimozione; impedisci rimozione/sostituzione quando Config live o progetto lo usa.
2. Dopo installazione aggiorna catalogo e permette di istanziare il profilo come Module
   con address/Bay/label/calibrazione specifici.
3. Supporta profili built-in, locali e da marketplace index con stessa semantica.

## Verifiche

- un'installazione interrotta non cambia il catalogo;
- un profilo in uso non può essere rimosso o sostituito;
- profili built-in, locali e da marketplace risultano indistinguibili una volta
  installati.

## Fine task

- [ ] Un dispositivo compatibile viene aggiunto end-to-end senza modificare sorgenti o
      fare OTA.
- [ ] Installazione interrotta e rimozione di profilo in uso sono gestite in sicurezza.
