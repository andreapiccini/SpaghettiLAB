import { Check } from "lucide-react";
import { type ReactNode } from "react";
import {
  BUS_PERIPHERALS,
  DIALECT_BLURB,
  DIALECT_LABEL,
  INTEGRATED_MODULES,
  PERIPHERAL_LABEL,
  dialectSections,
  peripheralOfDialect,
  type DialectKind,
  type DialectSection,
  type LogicalPeripheral,
  type ProtocolMode,
} from "../../lib/port-protocol-mock.js";

export function PortDialectPicker({
  peripherals,
  compatible,
  mode,
  dialect,
  integratedModuleId,
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
