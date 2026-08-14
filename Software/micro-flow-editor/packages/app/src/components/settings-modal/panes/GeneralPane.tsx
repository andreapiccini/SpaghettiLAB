import { chromeCopy } from "../../../lib/chrome-copy.js";
import { useLocale } from "../../../state/locale-context.js";
import { useUiMode } from "../../../state/ui-mode-context.js";
import { SettingsRow, SettingsSwitch } from "../SettingsRow.js";

export function GeneralPane() {
  const { mode, setMode } = useUiMode();
  const { locale } = useLocale();
  const copy = chromeCopy(locale);
  const advanced = mode === "advanced";

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-ink">{copy.categories.general.title}</h2>
      <p className="mt-1 font-body text-sm text-ink-muted">{copy.categories.general.subtitle}</p>
      <div className="mt-6 divide-y divide-border border-t border-border">
        <SettingsRow title={`${copy.modeCurrent}: ${advanced ? copy.modeAdvanced : copy.modeBase}`} description={copy.modeAdvancedHelp}>
          <SettingsSwitch checked={advanced} onChange={(on: boolean) => setMode(on ? "advanced" : "base")} label={copy.modeCurrent} />
        </SettingsRow>
      </div>
    </div>
  );
}
