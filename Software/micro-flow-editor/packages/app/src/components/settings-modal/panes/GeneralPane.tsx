import { chromeCopy } from "../../../lib/chrome-copy.js";
import { useLocale } from "../../../state/locale-context.js";
import { useSettingsModal } from "../../../state/settings-modal-context.js";
import { useTour } from "../../../state/tour-context.js";
import { useUiMode } from "../../../state/ui-mode-context.js";
import { SettingsRow, SettingsSwitch } from "../SettingsRow.js";

export function GeneralPane() {
  const { mode, setMode } = useUiMode();
  const { locale } = useLocale();
  const { start: startTour } = useTour();
  const { closeSettings } = useSettingsModal();
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
        <SettingsRow title={copy.tourReplay} description={copy.tourReplayHelp}>
          <button
            type="button"
            onClick={() => {
              closeSettings();
              startTour();
            }}
            className="h-8 shrink-0 rounded-slsm border border-border-strong px-3 font-body text-sm text-ink hover:bg-surface-raised"
          >
            {copy.tourReplayAction}
          </button>
        </SettingsRow>
      </div>
    </div>
  );
}
