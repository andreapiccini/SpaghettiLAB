# TASK-230-01 — Attivare MCUboot e le immagini A/B firmate

**Stato:** ⬜ TODO
**Fase:** 230 — MCUboot e A/B

## Cosa devo fare

Apri `boards/spaghettilab/spaghettilab_core_v1/spaghettilab_core_v1.dts` e verifica nel
DTS generato le partizioni esistenti: `boot_partition` 64 KiB, `slot0_partition` e
`slot1_partition` 1792 KiB ciascuna, `scratch_partition` 124 KiB e
`storage_partition` 192 KiB. Non cambiarle finché bootloader e immagine firmata vi
entrano.

Crea `sysbuild.conf` con `SB_CONFIG_BOOTLOADER_MCUBOOT=y` e il minimo file sysbuild
richiesto da Zephyr 4.4. Aggiungi una configurazione MCUboot separata che usa firma
ECDSA P-256. La chiave privata deve arrivare da un percorso host ignorato da Git; nel
repository può entrare soltanto la chiave pubblica o una chiave di sviluppo dichiarata
non produttiva.

Apri `prj.conf` e abilita `CONFIG_BOOTLOADER_MCUBOOT=y`, `CONFIG_FLASH=y`,
`CONFIG_FLASH_MAP=y`, `CONFIG_STREAM_FLASH=y` e `CONFIG_IMG_MANAGER=y`. Aggiorna
`Makefile` affinché build e pristine usino sysbuild e mostrino chiaramente gli artefatti
firmati. Il primo flash completo deve scrivere bootloader, tabella/metadata richiesti e
slot primario via USB: un firmware già installato non può aggiungere in sicurezza il
proprio bootloader.

## Perché è fatto così

MCUboot verifica la firma prima di avviare un'immagine e sa eseguire un boot di prova.
Lo slot secondario conserva il candidato mentre lo slot primario contiene la versione
funzionante. Le partizioni esistenti rendono inutile inventare una nuova mappa flash.

## Come si usa

La build deve produrre almeno l'immagine firmata caricabile nello slot secondario e un
artefatto completo per il provisioning iniziale via USB. Conserva hash e versione
dell'immagine nel report di build.

## Checklist di completamento

- [ ] MCUboot e applicazione vengono costruiti insieme con sysbuild.
- [ ] Una chiave errata o un'immagine modificata vengono rifiutate.
- [ ] La chiave privata e gli artefatti segreti sono ignorati da Git.
- [ ] Storage esistente sopravvive al nuovo layout e al reboot.

## Verifica e fine task

Esegui validator, build pristine sysbuild e flash completo via USB. Controlla
`build/zephyr/zephyr.dts`, i report delle dimensioni e il log MCUboot. Il risultato
atteso è l'avvio dell'immagine firmata da `image-0` senza perdita di Config o profili
Wi-Fi.
