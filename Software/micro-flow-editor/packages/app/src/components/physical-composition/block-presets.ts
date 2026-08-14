/**
 * Starting points for "+ Dispositivo esterno" — generic categories of physical
 * I/O block a project like this commonly needs (digital I/O, relays, isolated
 * inputs, serial ports, power supplies, ADC/DAC, environmental sensors,
 * indicators, wireless modems, ...). Project-authored reference data, not
 * something any Core ever declares — every pick always lands as a plain,
 * mostly-empty `external-device` node the user places, wires, and fills in for
 * real (S050's own "mai un'assunzione elettrica precompilata" rule); nothing
 * here is presented as verified against a real project's topology, and no field
 * carries electrical specifics (address, pinout, voltage thresholds) — those
 * come from whatever real part is chosen, filled in by hand after adding the
 * node.
 */
export type BlockPreset = {
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
};

export const BLOCK_PRESETS: readonly BlockPreset[] = [
  { code: "blk-io-4", name: "4 linee I/O digitali", category: "I/O digitale", description: "Quattro linee I/O digitali di uso generico." },
  { code: "blk-io-3g", name: "3 linee I/O + ground", category: "I/O digitale", description: "Tre linee I/O digitali più il riferimento di massa." },
  { code: "blk-io-2p5", name: "2 linee I/O + alimentazione 5V", category: "I/O digitale", description: "Due linee I/O digitali più uscita 5V e massa." },
  { code: "blk-relay-2lp", name: "2 relè bassa potenza", category: "Relè", description: "Due relè meccanici bassa potenza, contatti normalmente aperti indipendenti." },
  { code: "blk-relay-2hp", name: "2 relè alta potenza", category: "Relè", description: "Due relè meccanici alta potenza, contatti normalmente aperti/chiusi." },
  { code: "blk-relay-2ss", name: "2 relè a stato solido", category: "Relè", description: "Due relè a stato solido, normalmente aperti." },
  { code: "blk-relay-ac", name: "Relè a stato solido AC alta tensione", category: "Relè", description: "Relè a stato solido per carichi AC ad alta tensione, normalmente aperto." },
  { code: "blk-iso-2in", name: "2 ingressi isolati", category: "Ingressi isolati", description: "Due ingressi optoisolati con terminali indipendenti, isolati dalla massa di sistema." },
  { code: "blk-iso-3in-neg", name: "3 ingressi isolati, comune (-)", category: "Ingressi isolati", description: "Tre ingressi optoisolati con terminale comune negativo." },
  { code: "blk-iso-3in-pos", name: "3 ingressi isolati, comune (+)", category: "Ingressi isolati", description: "Tre ingressi optoisolati con terminale comune positivo." },
  { code: "blk-iso-4in", name: "4 ingressi optoisolati, massa comune", category: "Ingressi isolati", description: "Quattro ingressi optoisolati con terminale negativo a massa comune." },
  { code: "blk-dry-4in", name: "4 ingressi a contatto secco", category: "Ingressi isolati", description: "Quattro ingressi a contatto secco per interruttori esterni." },
  { code: "blk-rs232-4", name: "Porta RS232 (4 linee)", category: "Seriale", description: "Porta RS232 semplice con linee TX, RX, RTS, CTS." },
  { code: "blk-rs232-485", name: "Porta RS232/422/485", category: "Seriale", description: "Porta seriale universale con selezione elettronica della modalità." },
  { code: "blk-rs485", name: "Porta RS485", category: "Seriale", description: "Porta RS485 full/half-duplex, con uscita ausiliaria 5V." },
  { code: "blk-rs232-iso", name: "Porta RS232/422/485 isolata", category: "Seriale", description: "Porta seriale isolata galvanicamente con selezione modalità." },
  { code: "blk-oc-4", name: "4 uscite open collector", category: "Uscite", description: "Quattro uscite open collector." },
  { code: "blk-oc-2npn", name: "2 uscite open collector isolate NPN 24V", category: "Uscite", description: "Due uscite open collector isolate, configurazione NPN, 24V." },
  { code: "blk-oc-2pnp", name: "2 uscite open collector isolate PNP 24V", category: "Uscite", description: "Due uscite open collector isolate, configurazione PNP, 24V." },
  { code: "blk-psu-5v-lp", name: "Alimentatore 5V bassa potenza", category: "Alimentazione", description: "Alimentatore non isolato, uscita 5V, ingresso 9-18V, controllo di spegnimento." },
  { code: "blk-psu-5v-mp", name: "Alimentatore 5V media potenza", category: "Alimentazione", description: "Alimentatore non isolato, uscita 5V, ingresso 9-18V, controllo di spegnimento." },
  { code: "blk-psu-5v-hp", name: "Alimentatore 5V alta potenza", category: "Alimentazione", description: "Alimentatore non isolato, uscita 5V, ingresso 8-60V, controllo di spegnimento." },
  { code: "blk-psu-poe", name: "Alimentatore PoE isolato", category: "Alimentazione", description: "Alimentatore isolato per Power-over-Ethernet, uscita 5V." },
  { code: "blk-psu-wide", name: "Alimentatore ampio range di ingresso", category: "Alimentazione", description: "Alimentatore con ingresso 8-60V e corrente di uscita fino a diversi ampere." },
  { code: "blk-psu-dual15", name: "Alimentatore ±15V bassa potenza", category: "Alimentazione", description: "Alimentatore non isolato, uscita ±15V, ingresso 5V." },
  { code: "blk-adc-4ch", name: "ADC 4 canali", category: "Analogico", description: "Convertitore analogico-digitale a 4 canali, range ±10V." },
  { code: "blk-dac-4ch", name: "DAC 4 canali", category: "Analogico", description: "Convertitore digitale-analogico a 4 canali, range ±10V." },
  { code: "blk-adc-stream", name: "ADC streaming multicanale", category: "Analogico", description: "ADC ad alta precisione, acquisizione in streaming, multicanale." },
  { code: "blk-adc-iso", name: "ADC isolato ±10V/4-20mA", category: "Analogico", description: "Convertitore analogico-digitale isolato galvanicamente, ingresso in tensione o corrente (4-20mA)." },
  { code: "blk-pot-dig", name: "Potenziometro digitale", category: "Analogico", description: "Potenziometro digitale, risoluzione 8 bit, resistenza selezionabile." },
  { code: "blk-pwm-oc", name: "3 PWM open collector", category: "Uscite", description: "Tre uscite PWM con stadio open collector." },
  { code: "blk-pwm-pwr", name: "3 PWM con uscita di potenza", category: "Uscite", description: "Tre uscite PWM con stadio di potenza (alimentazione esterna richiesta)." },
  { code: "blk-temp-rtd", name: "Misuratore di temperatura RTD", category: "Sensori", description: "Ingresso per sonda di temperatura RTD." },
  { code: "blk-temp-amb", name: "Sensore di temperatura ambiente", category: "Sensori", description: "Sensore di temperatura ambientale integrato." },
  { code: "blk-temp-hum", name: "Sensore temperatura/umidità", category: "Sensori", description: "Sensore combinato di temperatura e umidità relativa." },
  { code: "blk-light", name: "Sensore di luce ambientale", category: "Sensori", description: "Sensore di luce ambientale nello spettro visibile." },
  { code: "blk-baro", name: "Sensore di pressione barometrica", category: "Sensori", description: "Sensore di pressione atmosferica." },
  { code: "blk-accel", name: "Accelerometro 3 assi", category: "Sensori", description: "Accelerometro a 3 assi, utilizzabile come sensore d'urto." },
  { code: "blk-btn", name: "Pulsante", category: "Interfaccia utente", description: "Pulsante singolo." },
  { code: "blk-led", name: "LED indicatore", category: "Interfaccia utente", description: "LED indicatore ad alta visibilità, colore selezionabile." },
  { code: "blk-ir", name: "Ricevitore/trasmettitore IR", category: "Interfaccia utente", description: "Circuito ricevitore infrarossi e diodo trasmettitore." },
  { code: "blk-rtc", name: "RTC con NVRAM tamponata", category: "Interfaccia", description: "Orologio in tempo reale e memoria non volatile con batteria tampone." },
  { code: "blk-onewire", name: "Porta 1-Wire", category: "Interfaccia", description: "Porta per bus 1-Wire/Single-Wire." },
  { code: "blk-sd", name: "Slot micro SD", category: "Storage", description: "Slot per scheda micro SD." },
  { code: "blk-usb", name: "Porta USB", category: "Interfaccia", description: "Porta USB, tipo Mini-B con supporto OTG." },
  { code: "blk-modem-lte", name: "Modem LTE (4G)", category: "Connettività", description: "Modem cellulare LTE per connettività remota." },
  { code: "blk-modem-nbiot", name: "Modem Cat-M1/NB-IoT", category: "Connettività", description: "Modem cellulare a basso consumo per applicazioni IoT." },
  { code: "blk-conn-terminal", name: "Blocco terminali", category: "Connettori", description: "Blocco di terminali a vite per cablaggio diretto." },
  { code: "blk-conn-db9", name: "Connettore DB9", category: "Connettori", description: "Connettore seriale DB9." },
  { code: "blk-conn-power", name: "Ingresso di alimentazione", category: "Connettori", description: "Jack di alimentazione più terminali a vite." },
  { code: "blk-ac-detect", name: "Rilevatore di tensione AC", category: "Sensori", description: "Rilevatore di presenza tensione di rete AC." },
  { code: "blk-fpga", name: "Coprocessore FPGA", category: "Elaborazione", description: "FPGA di piccole dimensioni per logica dedicata a bordo modulo." },
];
