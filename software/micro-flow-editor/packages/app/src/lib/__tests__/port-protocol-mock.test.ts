import { describe, expect, it } from "vitest";
import {
  applyExclusivePin,
  assignedPeripheralKinds,
  assignedPinCount,
  commandTargetsOf,
  compatibleDialects,
  dialectSections,
  hasConfigurablePins,
  fieldsForPeripheral,
  declaredPortsOf,
  defaultDirectDialect,
  defaultPinMap,
  isDirectOnly,
  nextFreeSignal,
  nextOpenPinIndex,
  nextRequiredSignal,
  numericIdForField,
  numericIdForGroup,
  pinCaption,
  pinColor,
  pinLetter,
  SIGNALS_FOR,
  SIGNAL_PALETTE,
  contentForInstalledDriver,
  pinSignalNumericId,
  peripheralsFromCapabilities,
  PORT_CAP,
  selectableSignalsForPort,
  signalsForRole,
  emptyLineSettings,
  protocolFromIntegrated,
  protocolFromPreset,
  sourceFieldsOf,
  summarizeConfiguredPort,
  takenSignals,
} from "../port-protocol-mock.js";

describe("port-protocol-mock", () => {
  it("starts a Port with unused pins", () => {
    const map = defaultPinMap(2);
    expect(map.portId).toBe(2);
    expect(map.pins).toHaveLength(5);
    expect(assignedPinCount(map)).toBe(0);
    expect(map.pins.map((p) => pinLetter(p.pinIndex))).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("loads the INA219 preset as named read fields", () => {
    const protocol = protocolFromPreset("preset.ina219", "p1");
    expect(protocol?.name).toBe("Sensore INA219");
    expect(sourceFieldsOf(protocol!).map((f) => f.name)).toEqual(["Bus voltage", "Shunt voltage", "Current", "Power"]);
    expect(commandTargetsOf(protocol!)).toEqual([]);
    expect(numericIdForField(protocol!, protocol!.fields[0]!.id)).toBe(1);
    expect(numericIdForGroup(protocol!, "missing")).toBe(0);
  });

  it("summarizes a saved Port for the canvas card", () => {
    const map = defaultPinMap(0);
    const pins = map.pins.map((p, i) => (i === 0 ? { ...p, peripheral: "uart" as const, signal: "TX", label: "UART0_TX" } : p));
    const protocol = protocolFromPreset("preset.ina219", "p1")!;
    const summary = summarizeConfiguredPort(0, { portId: 0, pins }, { ...protocol, portId: 0 });
    expect(summary.protocolName).toBe("Sensore INA219");
    expect(pinCaption(pins[0]!)).toBe("UART0_TX");
    expect(summary.fieldNames).toContain("Current");
    expect(summary.fields.map((f) => f.label)).toContain("Current");
    expect(assignedPeripheralKinds(pins)).toEqual(["uart"]);
    expect(fieldsForPeripheral(summary.fields, "i2c").map((f) => f.label)).toContain("Bus voltage");
  });

  it("gives UART TX and RX different token colors", () => {
    const tx = pinColor({ pinIndex: 1, peripheral: "uart", signal: "TX", label: "" });
    const rx = pinColor({ pinIndex: 2, peripheral: "uart", signal: "RX", label: "" });
    expect(tx).toBe("var(--color-brand-blue)");
    expect(rx).toBe("var(--color-error)");
    expect(tx).not.toBe(rx);
  });

  it("does not reuse a signal color on another peripheral while the palette has unused hues", () => {
    const seen: string[] = [];
    for (const peripheral of ["uart", "i2c", "spi", "can", "gpio", "adc", "pwm", "dac", "w1", "vcc", "gnd"] as const) {
      for (const signal of SIGNALS_FOR[peripheral]) {
        const color = pinColor({ pinIndex: 1, peripheral, signal, label: "" });
        expect(seen).not.toContain(color);
        seen.push(color);
      }
    }
    expect(seen.length).toBeLessThanOrEqual(SIGNAL_PALETTE.length);
    expect(pinColor({ pinIndex: 1, peripheral: "spi", signal: "MISO", label: "" })).not.toBe("var(--color-error)");
  });

  it("keeps a single protocol family on a Port and leaves VCC/GND in place", () => {
    const map = {
      portId: 0,
      pins: [
        { pinIndex: 1, peripheral: "i2c" as const, signal: "SDA", label: "" },
        { pinIndex: 2, peripheral: "i2c" as const, signal: "SCL", label: "" },
        { pinIndex: 3, peripheral: "gpio" as const, signal: "IN", label: "" },
        { pinIndex: 4, peripheral: "gnd" as const, signal: "GND", label: "" },
        { pinIndex: 5, peripheral: "unused" as const, signal: "", label: "" },
      ],
    };
    const next = applyExclusivePin(map, { pinIndex: 5, peripheral: "uart", signal: "TX", label: "" });
    expect(next.pins.map((p) => p.peripheral)).toEqual(["unused", "unused", "gpio", "gnd", "uart"]);
    expect(takenSignals(map, "i2c")).toEqual(["SDA", "SCL"]);
    expect(nextFreeSignal(map, "i2c")).toBe("");
    expect(nextFreeSignal(next, "uart")).toBe("RX");
    expect(nextOpenPinIndex(next, 5)).toBe(1);
    expect(nextRequiredSignal(map, "i2c")).toBe("");
    expect(nextRequiredSignal(next, "uart")).toBe("RX");
  });

  it("leaves optional UART lines free after TX/RX so leftover pins can be GPIO", () => {
    const map = {
      portId: 0,
      pins: [
        { pinIndex: 1, peripheral: "uart" as const, signal: "TX", label: "" },
        { pinIndex: 2, peripheral: "uart" as const, signal: "RX", label: "" },
        { pinIndex: 3, peripheral: "unused" as const, signal: "", label: "" },
        { pinIndex: 4, peripheral: "unused" as const, signal: "", label: "" },
        { pinIndex: 5, peripheral: "unused" as const, signal: "", label: "" },
      ],
    };
    expect(nextRequiredSignal(map, "uart")).toBe("");
    expect(nextFreeSignal(map, "uart")).toBe("RTS");
    const withGpio = applyExclusivePin(map, { pinIndex: 3, peripheral: "gpio", signal: "IN", label: "" });
    expect(withGpio.pins.map((p) => p.peripheral)).toEqual(["uart", "uart", "gpio", "unused", "unused"]);
  });

  it("offers UART dialects after TX/RX pins, and skips the picker for GPIO-only", () => {
    expect(compatibleDialects(["uart"])).toEqual(["uart", "modbus-rtu", "at", "raw-serial"]);
    expect(compatibleDialects(["i2c"])).toEqual(["i2c"]);
    expect(isDirectOnly(["gpio", "adc"])).toBe(true);
    expect(isDirectOnly(["gpio", "vcc", "gnd"])).toBe(true);
    expect(isDirectOnly(["gpio", "uart"])).toBe(false);
    expect(defaultDirectDialect(["gpio"])).toBe("gpio");
    expect(compatibleDialects([])).toEqual([]);
    expect(compatibleDialects(["vcc", "gnd"])).toEqual([]);
    expect(hasConfigurablePins([])).toBe(false);
    expect(hasConfigurablePins(["vcc", "gnd"])).toBe(false);
    expect(hasConfigurablePins(["i2c"])).toBe(true);
    expect(dialectSections([])).toEqual([]);
    expect(dialectSections(["i2c", "uart"]).map((s) => s.peripheral)).toEqual(["i2c", "uart"]);
    expect(dialectSections(["uart"])[0]?.dialects).toEqual(["uart", "modbus-rtu", "at", "raw-serial"]);
    expect(dialectSections(["i2c", "uart"], ["i2c"])).toEqual([{ peripheral: "i2c", dialects: ["i2c"] }]);
  });

  it("exposes assigned GPIO/ADC/PWM/DAC pins as Processing Graph sources and commands from settings", () => {
    const map = {
      portId: 0,
      pins: [
        { pinIndex: 1, peripheral: "i2c" as const, signal: "SDA", label: "" },
        { pinIndex: 2, peripheral: "i2c" as const, signal: "SCL", label: "" },
        { pinIndex: 3, peripheral: "gpio" as const, signal: "IO", label: "PIR", settings: emptyLineSettings("gpio") },
        { pinIndex: 4, peripheral: "adc" as const, signal: "CH", label: "", settings: emptyLineSettings("adc") },
        { pinIndex: 5, peripheral: "pwm" as const, signal: "PWM", label: "", settings: emptyLineSettings("pwm") },
      ],
    };
    const protocol = protocolFromIntegrated("preset.ina219", "p1")!;
    const signals = selectableSignalsForPort(map, protocol);
    expect(signalsForRole(signals, "source").map((s) => s.label)).toEqual(["Bus voltage", "Shunt voltage", "Current", "Power", "PIR", "ADC CH · D"]);
    expect(signalsForRole(signals, "command").map((s) => s.label)).toEqual(["PWM PWM · E"]);
    expect(signals.find((s) => s.label === "PIR")?.numericId).toBe(pinSignalNumericId(3));

    const withOutput = {
      ...map,
      pins: map.pins.map((pin) =>
        pin.pinIndex === 3 ? { ...pin, label: "Relay", settings: { ...emptyLineSettings("gpio"), kind: "gpio" as const, direction: "output" as const } } : pin,
      ),
    };
    const roles = selectableSignalsForPort(withOutput, protocol);
    expect(signalsForRole(roles, "source").map((s) => s.label)).not.toContain("Relay");
    expect(signalsForRole(roles, "command").map((s) => s.label)).toContain("Relay");

    const withDac = {
      portId: 0,
      pins: [{ pinIndex: 1, peripheral: "dac" as const, signal: "DAC", label: "Vout", settings: emptyLineSettings("dac") }],
    };
    expect(signalsForRole(selectableSignalsForPort(withDac), "command").map((s) => s.label)).toEqual(["Vout"]);
    expect(signalsForRole(selectableSignalsForPort(withDac), "source")).toEqual([]);
  });

  it("reads MCU peripherals from the Core capability mask, never inventing CAN", () => {
    expect(peripheralsFromCapabilities(undefined)).toEqual(["vcc", "gnd"]);
    expect(peripheralsFromCapabilities(PORT_CAP.I2C)).toEqual(["i2c", "vcc", "gnd"]);
    expect(peripheralsFromCapabilities(PORT_CAP.DIGITAL_INPUT | PORT_CAP.DIGITAL_OUTPUT)).toEqual(["gpio", "vcc", "gnd"]);
    expect(peripheralsFromCapabilities(PORT_CAP.I2C | PORT_CAP.ADC | PORT_CAP.DAC)).toEqual(["i2c", "adc", "dac", "vcc", "gnd"]);
    expect(peripheralsFromCapabilities(PORT_CAP.I2C)).not.toContain("can");
    expect(nextFreeSignal(defaultPinMap(0), "gpio")).toBe("IO");
    expect(nextFreeSignal({ portId: 0, pins: [{ pinIndex: 1, peripheral: "gpio", signal: "IO", label: "" }] }, "gpio")).toBe("IO");
  });

  it("exposes installed Core driver content beyond typeId and command count", () => {
    const ina = contentForInstalledDriver("ina219");
    expect(ina.config.map((f) => f.name)).toEqual(["address", "shunt_milliohm", "current_lsb_microamp"]);
    expect(ina.records.map((f) => f.name)).toContain("bus_voltage_microvolts");
    expect(ina.protocol?.fields.map((f) => f.label)).toEqual(["Bus voltage", "Shunt voltage", "Current", "Power"]);
    const relay = contentForInstalledDriver("relay");
    expect(relay.commands[0]?.name).toBe("set");
    expect(contentForInstalledDriver("unknown-driver").config).toEqual([]);
  });

  it("loads an integrated module with interface settings and mappings", () => {
    const protocol = protocolFromIntegrated("mod.pzem004t", "pzem");
    expect(protocol?.mode).toBe("integrated");
    expect(protocol?.dialect).toBe("modbus-rtu");
    expect(protocol?.settings.kind).toBe("modbus-rtu");
    expect(protocol?.fields).toHaveLength(2);
    expect(protocol?.fields[0]?.spec.kind).toBe("modbus-rtu");
  });

  it("reads Port 0 and Port 1 from GET_TOPOLOGY flows, with 5 signals each", () => {
    const ports = declaredPortsOf({
      ports: [{ portId: 0 }, { portId: 1 }],
      flows: [
        { flowId: 0, portId: 0, signalCount: 5, capabilities: PORT_CAP.I2C },
        { flowId: 1, portId: 1, signalCount: 5, capabilities: PORT_CAP.DIGITAL_INPUT | PORT_CAP.DIGITAL_OUTPUT },
      ],
    });
    expect(ports.map((p) => p.portId)).toEqual([0, 1]);
    expect(ports.every((p) => p.fromCore && p.signalCount === 5)).toBe(true);
    expect(ports[0]?.capabilities).toBe(PORT_CAP.I2C);
    expect(ports[1]?.capabilities).toBe(PORT_CAP.DIGITAL_INPUT | PORT_CAP.DIGITAL_OUTPUT);
  });
});
