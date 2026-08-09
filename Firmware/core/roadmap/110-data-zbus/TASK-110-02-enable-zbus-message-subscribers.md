# TASK-110-02 — Abilitare i subscriber di zbus

**Stato:** ⬜ TODO
**Fase:** 110 — Data / zbus
**Dipende da:** [TASK-110-01](TASK-110-01-define-the-temperature-sample-message.md)
**Impegno stimato:** Piccolo

---

## Obiettivo

Questo task deve produrre un solo risultato verificabile:

Copia indipendente per entrambi gli subscriber.

---

## File da aprire

`prj.conf`.

---

## Orientamento Zephyr — zbus, channel e subscriber

1. **Cos’è:** zbus è il bus di messaggi interno di Zephyr. Un channel definisce tipo del messaggio e osservatori; un message subscriber riceve una copia tramite una coda limitata.
2. **A cosa serve:** Disaccoppia chi pubblica un campione dai consumer che lo elaborano a velocità diverse.
3. **Quando viene usato:** Canali e subscriber sono dichiarati staticamente; pubblicazione e ricezione avvengono a runtime.
4. **Build-time o runtime:** Strutture create a build-time, scambio dati a runtime.
5. **Collegamento con questo task:** Data dovrà consegnare lo stesso campione al logger e a un secondo consumer senza condividere puntatori temporanei.
6. **File reali coinvolti:** `prj.conf` in questo task; dichiarazioni di canale e subscriber arriveranno in `subsys/data/data.c` nel task successivo.
7. **Cosa guardare nei file:** Controlla `CONFIG_ZBUS`, supporto message subscriber e capacità delle code nell’help Kconfig installato.
8. **Cosa non modificare:** Non usare allocazione dinamica, non usare zbus automaticamente per lifecycle/comandi e non creare ancora consumer MQTT.

---

## Cosa scrivere o modificare

Abilita `CONFIG_ZBUS=y` e `CONFIG_ZBUS_MSG_SUBSCRIBER=y`. Seleziona solo le impostazioni
del buffer di messaggi static/fixed richieste dall'aiuto Kconfig installato; non
abilitare l'allocazione dinamica per impostazione predefinita.

---

## Perché

L'automazione Runtime non dovrebbe perdere silenziosamente un campione intermedio.

---

## Chi usa il risultato

Publisher e due thread di consumo di prova.

---

## Evento che attiva il codice

ARRIVO DATI.

---

## Meccanismo di invocazione

Abbonamento al messaggio ZBUS Publish / ZBUS.

---

## Contesto di esecuzione

Publisher thread; thread di prova dedicati ai consumatori.

---

## Chiamate e dipendenze

`zbus_chan_pub`, `zbus_sub_wait_msg`.

---

## Input

Copia del campione.

---

## Output

Copia indipendente per entrambi gli subscriber.

---

## Errori da gestire

Rifiuto del validatore, esaurimento allocation/pool, timeout.

---

## Non implementare ancora

- Consumatori MQTT o Communication

---


## Procedura

- [ ] Apri solo `prj.conf`.
- [ ] Abilita `CONFIG_ZBUS=y` e `CONFIG_ZBUS_MSG_SUBSCRIBER=y`.
- [ ] Seleziona solo le impostazioni del buffer di messaggi static/fixed richieste
      dall'aiuto Kconfig installato
- [ ] non abilitano l'allocazione dinamica per impostazione predefinita.
- [ ] Gestisci solo questi errori realistici: Rifiuto del validatore, esaurimento
      allocation/pool, timeout.
- [ ] Conferma che non sia stato aggiunto alcun elemento di **Non implementare ancora**
- [ ] Esegui la verifica del task e confrontala con il **Risultato atteso**

---

## Build

SÌ — `make pristine`

---

## Flash

NO

---

## Verifica

Pubblicare un campione falso; ogni test consumer registra lo stesso sequence/value una
volta.

---

## Risultato atteso

Due ricevute indipendenti.

---

## Checklist di completamento

- [ ] La documentazione o il file di implementazione richiesto è stato modificato come
      specificato
- [ ] Il tipo, la funzione, la configurazione o il test indicato esiste
- [ ] La build riesce quando il task la richiede
- [ ] La verifica specifica del task passa
- [ ] Non è stata aggiunta funzionalità estranea al task

---

## Commit suggerito

`data: enable zbus message subscribers`

---

## Task successivo

[TASK-110-03](TASK-110-03-define-the-temperature-channel-and-subscribers.md) — Definire il canale temperatura e i subscriber
