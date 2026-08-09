# TASK-150-01 — Decodificare Config con CBOR

**Stato:** ⬜ TODO
**Fase:** 150 — CBOR

## Prima di scrivere: concetti Zephyr

### Abilitare zcbor e aggiungere il sorgente codec

1. **Cos’è:** zcbor è la libreria integrata da Zephyr per codificare e decodificare CBOR con stato e buffer limitati.
2. **A cosa serve:** Trasforma bytes di Communication nel modello Config senza parser testuale o allocazioni non controllate.
3. **Quando viene usato:** Kconfig e CMake includono la libreria a build-time; il decoder opera a runtime su un buffer ricevuto.
4. **Build-time o runtime:** Integrazione a build-time, decodifica a runtime.
5. **Collegamento con questo task:** Lo schema V0 è già definito; questo task prepara il sorgente che lo implementerà.
6. **File reali coinvolti:** `prj.conf`, `CMakeLists.txt` e il nuovo `subsys/config/config_cbor.c`.
7. **Cosa guardare nei file:** Controlla l’opzione zcbor disponibile, gli header installati e l’inclusione del nuovo sorgente nel target `app`.
8. **Cosa non modificare:** Non copiare una seconda versione di zcbor, non accettare campi extra e non applicare Config direttamente dal decoder.

## Perché lo facciamo

Il decoder traduce bytes non fidati in Config senza applicarla; validazione e commit restano responsabilità di Config.

## Implementazione guidata

### Passo 1 — Documentare lo schema CBOR V0

Crea `subsys/config/spaghetti_config_v0.cddl`.

Scrivi questo schema esatto:

```cddl
spaghetti-config-v0 = {
  0: 1,
  1: [module],
  2: sampling
}
module = { 0: 0, 1: "sht40", 2: 68 }
sampling = { 0: 1..86400000, 1: bool }
```

Le chiavi `0`, `1` e `2` sono rispettivamente versione, moduli e sampling. Il solo
modulo ammesso in V0 è Port 0, SHT40, indirizzo decimale 68 (`0x44`). Il periodo è in
millisecondi da 1 a un giorno. Le mappe non accettano chiavi aggiuntive o duplicate.

### Passo 2 — Dichiarare il confine del decoder Config

Crea `include/spaghetti/config_codec.h`.

Dichiara `spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length, struct
spaghetti_config *out)`. Documento che l'output cambia solo dopo un completo successo
sintattico e semantico.

### Passo 3 — Abilitare zcbor e aggiungere il sorgente codec

`prj.conf`, `CMakeLists.txt` e crea `subsys/config/config_cbor.c`.

Abilitare `CONFIG_ZCBOR=y` e aggiungere `config_cbor.c` alle sorgenti dell’applicazione.
Confermare le forniture di integrazione Zephyr installate richiede zcbor
header e sorgenti; non importare nel repository una seconda copia della libreria.

### Passo 4 — Implementare la decodifica CBOR V0 rigorosa

`subsys/config/config_cbor.c` e lo schema V0.

Decodificare in una `spaghetti_config` temporanea, applicare ogni tipo, intervallo,
stringa legata, numero di elementi, versione e consumo di ingresso completo, quindi
chiamare la convalida Config e copiare a `out` solo dopo il successo completo.

### Passo 5 — Applicare CBOR tramite Communication

`subsys/communication/communication.c` e `subsys/communication/communication_shell.c`.

Fai chiamare SET_CONFIG il decoder CBOR e poi `spaghetti_config_apply()`. Mantieni la
shell `apply` limitata alla conversione esadecimale limitata. Restituisci decodifica
separata, convalida semantica e applica errori.

### Passo 6 — Provare payload CBOR validi e non validi

L'imbracatura di prova del codec, la shell USB e la console seriale.

Provare un payload V0 valido più ingresso troncato, tipo errato, stringa oversize,
versione sconosciuta, byte di completamento, indirizzo non valido e Manager applicare il
guasto. Confermare payload falliti non modificare l'istantanea attiva.

### Contratti completi da scrivere

```c
int spaghetti_config_decode_cbor(const uint8_t *bytes, size_t length,
				 struct spaghetti_config *out);
```

`bytes` è un buffer `const` non nullo posseduto dal trasporto e valido solo durante la
chiamata; `length` è il numero esatto di byte e non può superare 256; `out` appartiene
al chiamante e cambia solo dopo decodifica e validazione complete. Restituisce `0`,
`-EINVAL`, `-EMSGSIZE`, `-EBADMSG` o `-ENOTSUP`.

Documenta nel task e nei test lo schema CBOR V0 come mappa con chiavi intere: `0`
versione=1, `1` array moduli con port/type/address, `2` mappa sampling con period_ms ed
enabled. Tutti i campi sono obbligatori; chiavi duplicate, sconosciute, tipi errati,
trailing bytes e valori fuori limite falliscono. `config_codec.c` usa zcbor per
riempire una variabile temporanea, chiama validate e copia in `out` solo al successo.
Communication chiama decode e poi apply, mantenendo distinti i due errno.

Implementa `spaghetti_config_decode_cbor()` in ordine: valida i tre argomenti; crea
`struct spaghetti_config temporary = {0}`; inizializza lo stato zcbor sul buffer;
apre la mappa root; decodifica le chiavi nell’ordine previsto verificandone valori e
numero; chiude tutte le collezioni; verifica che il cursore sia esattamente a fine
buffer; chiama `spaghetti_config_validate(&temporary)`; infine assegna
`*out = temporary`. Nessun ramo di errore deve scrivere `out`.

## Esempio d’uso

```c
struct spaghetti_config decoded;
int err = spaghetti_config_decode_cbor(payload, payload_size, &decoded);
if (err == 0) {
	err = spaghetti_config_apply(&decoded);
}
```

## Checklist di completamento

- [ ] Documentare lo schema CBOR V0.
- [ ] Dichiarare il confine del decoder Config.
- [ ] Abilitare zcbor e aggiungere il sorgente codec.
- [ ] Implementare la decodifica CBOR V0 rigorosa.
- [ ] Applicare CBOR tramite Communication.
- [ ] Provare payload CBOR validi e non validi.

## Verifica finale

**Comandi**

```sh
make validate
make pristine
make flash
make monitor
```

**Controlla**

Aggiungi vettori per payload valido, troncato, chiave mancante/extra/duplicata, tipo errato, limite superato e trailing bytes. `out` resta invariato su ogni errore; prova apply via Shell.

**Risultato atteso**

Solo il CBOR V0 completo produce Config; ogni errore lascia `out` e stato attivo invariati.
