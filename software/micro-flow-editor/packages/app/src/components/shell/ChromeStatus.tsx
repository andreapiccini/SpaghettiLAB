import { chromeCopy } from "../../lib/chrome-copy.js";
import { localeMeta } from "../../lib/locale.js";
import { useLocale } from "../../state/locale-context.js";
import { useSettingsModal } from "../../state/settings-modal-context.js";
import { useUiMode } from "../../state/ui-mode-context.js";

/** Always-visible chrome: current mode as a readable label, plus language. */
export function ChromeStatus() {
  const { mode } = useUiMode();
  const { locale } = useLocale();
  const { openSettings } = useSettingsModal();
  const copy = chromeCopy(locale);
  const language = localeMeta(locale);
  const modeValue = mode === "advanced" ? copy.modeAdvanced : copy.modeBase;

  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-slpill border border-border-strong px-2.5 py-1 font-body text-xs text-ink-muted">
        {copy.modeCurrent}: {modeValue}
      </span>
      <button
        type="button"
        onClick={() => openSettings("language")}
        title={copy.categories.language.title}
        className="flex items-center gap-1.5 rounded-slpill border border-border-strong px-2.5 py-1 font-body text-xs text-ink-muted hover:bg-surface-raised"
      >
        <span aria-hidden>{language.flag}</span>
        <span>{language.name}</span>
      </button>
    </div>
  );
}
