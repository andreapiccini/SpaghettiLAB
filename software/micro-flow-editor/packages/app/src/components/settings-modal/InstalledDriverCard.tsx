import { useState, type ReactNode } from "react";
import {
  compositionLines,
  contentForInstalledDriver,
  type DriverSchemaField,
  type InstalledDriverContent,
} from "../../lib/port-protocol-mock.js";

export function InstalledDriverCard({
  typeId,
  commandCount,
  profiles,
}: {
  readonly typeId: string;
  readonly commandCount: number;
  readonly profiles?: readonly { readonly profileId: string; readonly version: number }[];
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
      {open && <InstalledDriverBody content={content} commandCount={commandCount} profiles={profiles ?? []} />}
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
