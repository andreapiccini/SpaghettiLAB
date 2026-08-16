import { Check } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  BUS_PERIPHERALS,
  DIALECT_BLURB,
  DIALECT_LABEL,
  INTEGRATED_MODULES,
  PERIPHERAL_LABEL,
  compositionLines,
  contentForInstalledDriver,
  dialectSections,
  peripheralOfDialect,
  type DialectKind,
  type DialectSection,
  type DriverSchemaField,
  type InstalledDriverContent,
  type LogicalPeripheral,
  type ProtocolMode,
} from "../../lib/port-protocol-mock.js";

export function PortDialectPicker({
  peripherals,
  compatible,
  mode,
  dialect,
  integratedModuleId,
  catalogDrivers = [],
  installedProfiles = [],
  onMode,
  onDialect,
  onIntegrated,
  onNext,
}: {
  readonly peripherals: readonly LogicalPeripheral[];
  readonly compatible: readonly DialectKind[];
  readonly mode: ProtocolMode;
  readonly dialect?: DialectKind;
  readonly integratedModuleId?: string;
  readonly catalogDrivers?: readonly { readonly typeId: string; readonly commandCount: number }[];
  readonly installedProfiles?: readonly { readonly profileId: string; readonly version: number }[];
  readonly onMode: (mode: ProtocolMode) => void;
  readonly onDialect: (dialect: DialectKind) => void;
  readonly onIntegrated: (moduleId: string) => void;
  readonly onNext: () => void;
}) {
  const sections = dialectSections(peripherals);
  const modules = INTEGRATED_MODULES.filter((mod) => compatible.includes(mod.dialect));
  const canContinue = mode === "custom" ? dialect !== undefined && compatible.includes(dialect) : Boolean(integratedModuleId);
  const fromPins = peripherals.some((p) => (BUS_PERIPHERALS as readonly string[]).includes(p));

  return (
    <div className="flex flex-col gap-4">
      <p className="font-body text-sm text-ink-muted">Come parla il dispositivo su questi pin?</p>

      <div className="grid grid-cols-2 gap-1 rounded-slmd bg-surface-sunken p-1">
        <ModeButton active={mode === "integrated"} onClick={() => onMode("integrated")} label="Modulo integrato" />
        <ModeButton active={mode === "custom"} onClick={() => onMode("custom")} label="Protocollo custom" />
      </div>

      {mode === "custom" ? (
        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <PeripheralSection key={section.peripheral} section={section} fromPins={fromPins}>
              {section.dialects.map((kind) => (
                <ChoiceCard
                  key={kind}
                  title={DIALECT_LABEL[kind]}
                  subtitle={DIALECT_BLURB[kind]}
                  selected={dialect === kind}
                  onClick={() => onDialect(kind)}
                />
              ))}
            </PeripheralSection>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {modules.length === 0 && (
            <p className="font-body text-sm text-ink-muted">
              {fromPins ? (
                <>
                  Nessun modulo per questa periferica,{" "}
                  <button type="button" onClick={() => onMode("custom")} className="font-semibold text-brand-blue hover:underline">
                    crearne uno custom
                  </button>
                  .
                </>
              ) : (
                "Assegna prima i pin della Porta. Poi compariranno solo i moduli compatibili con quelle periferiche."
              )}
            </p>
          )}
          {sections.map((section) => {
            const inSection = modules.filter((mod) => peripheralOfDialect(mod.dialect) === section.peripheral);
            if (inSection.length === 0) return null;
            return (
              <PeripheralSection key={section.peripheral} section={section} fromPins={fromPins}>
                {inSection.map((mod) => (
                  <ChoiceCard
                    key={mod.id}
                    title={mod.name}
                    subtitle={`${DIALECT_LABEL[mod.dialect]} · ${mod.fields.length} mapping già pronti`}
                    selected={integratedModuleId === mod.id}
                    onClick={() => onIntegrated(mod.id)}
                  />
                ))}
              </PeripheralSection>
            );
          })}
          {fromPins && catalogDrivers.length > 0 && (
            <section>
              <SectionHeading title="Dal Core" hint="Già presenti sul Core" />
              <div className="flex flex-col gap-1.5">
                {catalogDrivers.map((driver) => (
                  <InstalledDriverRow
                    key={driver.typeId}
                    typeId={driver.typeId}
                    commandCount={driver.commandCount}
                    profiles={driver.typeId === "declarative-device" ? installedProfiles : []}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!canContinue}
        onClick={onNext}
        className="h-9 rounded-slsm bg-brand-blue font-body-strong text-sm text-white hover:bg-brand-blue-dark disabled:opacity-40"
      >
        {mode === "integrated" ? "Salva e chiudi" : "Avanti"}
      </button>
    </div>
  );
}

function PeripheralSection({
  section,
  fromPins,
  children,
}: {
  readonly section: DialectSection;
  readonly fromPins: boolean;
  readonly children: ReactNode;
}) {
  const count = section.dialects.length;
  return (
    <section>
      <SectionHeading
        title={PERIPHERAL_LABEL[section.peripheral]}
        hint={fromPins ? `${count === 1 ? "1 protocollo" : `${count} protocolli`} su questi pin` : `Disponibile se assegni pin ${PERIPHERAL_LABEL[section.peripheral]}`}
      />
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function SectionHeading({ title, hint }: { readonly title: string; readonly hint: string }) {
  return (
    <div className="mb-1.5">
      <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{title}</p>
      <p className="font-body text-[10px] text-ink-faint">{hint}</p>
    </div>
  );
}

function InstalledDriverRow({
  typeId,
  commandCount,
  profiles,
}: {
  readonly typeId: string;
  readonly commandCount: number;
  readonly profiles: readonly { readonly profileId: string; readonly version: number }[];
}) {
  const [open, setOpen] = useState(false);
  const content = contentForInstalledDriver(typeId);
  return (
    <div className="rounded-slmd border border-border bg-surface px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm text-ink">{typeId}</p>
          <p className="font-body text-xs text-ink-faint">
            Presente sul Core · {commandCount === 1 ? "1 comando" : `${commandCount} comandi`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="shrink-0 rounded-slsm border border-border-strong px-2 py-1 font-body text-[11px] text-ink hover:bg-surface-raised"
        >
          {open ? "Chiudi" : "Leggi"}
        </button>
      </div>
      {open && <InstalledDriverBody content={content} commandCount={commandCount} profiles={profiles} />}
    </div>
  );
}

function InstalledDriverBody({
  content,
  commandCount,
  profiles,
}: {
  readonly content: InstalledDriverContent;
  readonly commandCount: number;
  readonly profiles: readonly { readonly profileId: string; readonly version: number }[];
}) {
  const settings = content.protocol?.settings;
  return (
    <div className="mt-2 flex flex-col gap-2.5 rounded-slsm bg-surface-sunken px-2.5 py-2">
      <div>
        <p className="font-body text-xs font-semibold text-ink">{content.name}</p>
        <p className="font-body text-[11px] text-ink-muted">{content.blurb}</p>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-body text-[11px]">
        <span className="text-ink-faint">typeId</span>
        <span className="truncate font-mono text-ink">{content.typeId}</span>
        {content.transport !== "" && (
          <>
            <span className="text-ink-faint">Trasporto</span>
            <span className="text-ink">{content.transport}</span>
          </>
        )}
        {content.configSchema !== "" && (
          <>
            <span className="text-ink-faint">Schema</span>
            <span className="truncate font-mono text-ink">{content.configSchema}</span>
          </>
        )}
        <span className="text-ink-faint">Comandi wire</span>
        <span className="font-mono text-ink">{commandCount}</span>
      </div>
      {settings && (
        <DriverSection title="Interfaccia">
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {Object.entries(settings)
              .filter(([key, value]) => key !== "kind" && String(value).trim() !== "")
              .map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <span className="font-body text-[9px] uppercase tracking-wide text-ink-faint">{key}</span>
                  <div className="truncate font-mono text-[10px] text-ink">{String(value)}</div>
                </div>
              ))}
          </div>
        </DriverSection>
      )}
      {content.config.length > 0 && (
        <DriverSection title="Config">
          {content.config.map((field) => (
            <SchemaFieldRow key={field.fieldId} field={field} />
          ))}
        </DriverSection>
      )}
      {content.records.length > 0 && (
        <DriverSection title="Record">
          {content.records.map((field) => (
            <SchemaFieldRow key={field.fieldId} field={field} />
          ))}
        </DriverSection>
      )}
      {content.commands.length > 0 && (
        <DriverSection title="Comandi">
          {content.commands.map((command) => (
            <div key={command.commandId}>
              <p className="font-mono text-[11px] text-ink">
                {command.commandId} · {command.name}
              </p>
              {command.fields.map((field) => (
                <SchemaFieldRow key={field.fieldId} field={field} />
              ))}
            </div>
          ))}
        </DriverSection>
      )}
      {content.protocol && content.protocol.fields.length > 0 && (
        <DriverSection title="Grandezze">
          {content.protocol.fields.map((field) => (
            <div key={field.id} className="rounded-slsm bg-surface px-2 py-1.5">
              <p className="font-body text-[11px] font-semibold text-ink">{field.label || field.name}</p>
              <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
                {compositionLines(field).map((line) => (
                  <div key={line.label} className="min-w-0">
                    <span className="font-body text-[9px] uppercase tracking-wide text-ink-faint">{line.label}</span>
                    <div className="truncate font-mono text-[10px] text-ink">{line.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </DriverSection>
      )}
      {profiles.length > 0 && (
        <DriverSection title="Profili sul Core">
          {profiles.map((profile) => (
            <p key={`${profile.profileId}@${profile.version}`} className="font-mono text-[11px] text-ink">
              {profile.profileId}@{profile.version}
            </p>
          ))}
        </DriverSection>
      )}
    </div>
  );
}

function DriverSection({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-body text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{title}</p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function SchemaFieldRow({ field }: { readonly field: DriverSchemaField }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[11px] text-ink">
        {field.fieldId} · {field.name}
        {field.unit ? ` · ${field.unit}` : ""}
      </p>
      <p className="font-body text-[10px] text-ink-faint">
        {field.type}
        {field.description !== "" ? ` — ${field.description}` : ""}
      </p>
    </div>
  );
}

function ChoiceCard({
  title,
  subtitle,
  selected,
  onClick,
  mono,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly selected: boolean;
  readonly onClick: () => void;
  readonly mono?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-slmd border px-3 py-2 text-left ${selected ? "border-brand-blue bg-surface-raised" : "border-border hover:bg-surface-raised"}`}
    >
      <span className={`flex items-center justify-between text-sm text-ink ${mono ? "font-mono" : "font-body"}`}>
        {title}
        {selected && <Check size={14} className="text-brand-blue" />}
      </span>
      <span className="block font-body text-xs text-ink-faint">{subtitle}</span>
    </button>
  );
}

function ModeButton({ active, onClick, label }: { readonly active: boolean; readonly onClick: () => void; readonly label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-slsm px-2 py-1.5 font-body text-xs ${active ? "bg-surface font-semibold text-ink shadow-e1" : "text-ink-muted hover:text-ink"}`}
    >
      {label}
    </button>
  );
}
