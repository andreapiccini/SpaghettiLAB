import {
  gpioDirectionsFromCapabilities,
  type PinLineSettings,
} from "../../lib/port-protocol-mock.js";

export function PinLineSettingsForm({
  settings,
  capabilities,
  onChange,
}: {
  readonly settings: PinLineSettings;
  readonly capabilities?: number;
  readonly onChange: (next: PinLineSettings) => void;
}) {
  if (settings.kind === "gpio") {
    const dirs = gpioDirectionsFromCapabilities(capabilities);
    return (
      <FormGrid>
        <Select
          label="Direzione"
          value={settings.direction}
          options={dirs.map((value) => ({ value, label: value === "input" ? "Input" : "Output" }))}
          onChange={(direction) => onChange({ ...settings, direction: direction as "input" | "output" })}
        />
        <Select
          label="Polarità"
          value={settings.polarity}
          options={[
            { value: "high", label: "Active high" },
            { value: "low", label: "Active low" },
          ]}
          onChange={(polarity) => onChange({ ...settings, polarity: polarity as "high" | "low" })}
        />
        <Select
          label="Pull"
          value={settings.pull}
          options={[
            { value: "none", label: "Nessuno" },
            { value: "up", label: "Pull-up" },
            { value: "down", label: "Pull-down" },
          ]}
          onChange={(pull) => onChange({ ...settings, pull: pull as "none" | "up" | "down" })}
        />
        {settings.direction === "input" && (
          <>
            <Text label="Debounce (ms)" value={settings.debounceMs} onChange={(debounceMs) => onChange({ ...settings, debounceMs })} />
            <Select
              label="Edge trigger"
              value={settings.edge}
              options={[
                { value: "none", label: "Nessuno" },
                { value: "rising", label: "Rising" },
                { value: "falling", label: "Falling" },
                { value: "both", label: "Both" },
              ]}
              onChange={(edge) => onChange({ ...settings, edge: edge as "none" | "rising" | "falling" | "both" })}
            />
          </>
        )}
        {settings.direction === "output" && (
          <>
            <Text label="Valore iniziale" value={settings.initial} onChange={(initial) => onChange({ ...settings, initial })} />
            <Text label="Safe state" value={settings.safeState} onChange={(safeState) => onChange({ ...settings, safeState })} />
          </>
        )}
      </FormGrid>
    );
  }

  if (settings.kind === "adc") {
    return (
      <FormGrid>
        <Text label="Risoluzione (bit)" value={settings.resolution} onChange={(resolution) => onChange({ ...settings, resolution })} />
        <Text label="Campionamento (Hz)" value={settings.sampleHz} onChange={(sampleHz) => onChange({ ...settings, sampleHz })} />
        <Text label="Range min (mV)" value={settings.rangeMin} onChange={(rangeMin) => onChange({ ...settings, rangeMin })} />
        <Text label="Range max (mV)" value={settings.rangeMax} onChange={(rangeMax) => onChange({ ...settings, rangeMax })} />
        <Text label="Grezzo min" value={settings.rawMin} onChange={(rawMin) => onChange({ ...settings, rawMin })} />
        <Text label="Grezzo max" value={settings.rawMax} onChange={(rawMax) => onChange({ ...settings, rawMax })} />
        <Text label="Filtro" value={settings.filter} onChange={(filter) => onChange({ ...settings, filter })} wide />
      </FormGrid>
    );
  }

  if (settings.kind === "pwm") {
    return (
      <FormGrid>
        <Text label="Frequenza (Hz)" value={settings.frequencyHz} onChange={(frequencyHz) => onChange({ ...settings, frequencyHz })} />
        <Select
          label="Polarità"
          value={settings.polarity}
          options={[
            { value: "high", label: "Active high" },
            { value: "low", label: "Active low" },
          ]}
          onChange={(polarity) => onChange({ ...settings, polarity: polarity as "high" | "low" })}
        />
        <Text label="Duty min (%)" value={settings.dutyMin} onChange={(dutyMin) => onChange({ ...settings, dutyMin })} />
        <Text label="Duty max (%)" value={settings.dutyMax} onChange={(dutyMax) => onChange({ ...settings, dutyMax })} />
        <Text label="Valore iniziale" value={settings.initial} onChange={(initial) => onChange({ ...settings, initial })} />
        <Text label="Safe state" value={settings.safeState} onChange={(safeState) => onChange({ ...settings, safeState })} />
        <Text label="Range proprietà min" value={settings.rangeMin} onChange={(rangeMin) => onChange({ ...settings, rangeMin })} />
        <Text label="Range proprietà max" value={settings.rangeMax} onChange={(rangeMax) => onChange({ ...settings, rangeMax })} />
      </FormGrid>
    );
  }

  return (
    <FormGrid>
      <Text label="Risoluzione (bit)" value={settings.resolution} onChange={(resolution) => onChange({ ...settings, resolution })} />
      <Text label="Range min (mV)" value={settings.rangeMin} onChange={(rangeMin) => onChange({ ...settings, rangeMin })} />
      <Text label="Range max (mV)" value={settings.rangeMax} onChange={(rangeMax) => onChange({ ...settings, rangeMax })} />
      <Text label="Grezzo min" value={settings.rawMin} onChange={(rawMin) => onChange({ ...settings, rawMin })} />
      <Text label="Grezzo max" value={settings.rawMax} onChange={(rawMax) => onChange({ ...settings, rawMax })} />
      <Text label="Valore iniziale" value={settings.initial} onChange={(initial) => onChange({ ...settings, initial })} />
      <Text label="Safe state" value={settings.safeState} onChange={(safeState) => onChange({ ...settings, safeState })} wide />
    </FormGrid>
  );
}

function FormGrid({ children }: { readonly children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function Text({
  label,
  value,
  onChange,
  wide,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? "col-span-2" : ""}`}>
      <span className="mb-1 block font-body text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-slsm border border-border-strong px-2 py-1.5 font-body text-xs outline-none" />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-body text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-slsm border border-border-strong px-2 py-1.5 font-body text-xs outline-none">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
