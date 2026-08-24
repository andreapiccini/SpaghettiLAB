import { chromeCopy } from "../../../lib/chrome-copy.js";
import { SUPPORTED_LOCALES } from "../../../lib/locale.js";
import { useLocale } from "../../../state/locale-context.js";

export function LanguagePane() {
  const { locale, setLocale } = useLocale();
  const copy = chromeCopy(locale);

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-ink">{copy.categories.language.title}</h2>
      <p className="mt-1 font-body text-sm text-ink-muted">{copy.languageHelp}</p>
      <div className="mt-6 flex flex-col gap-2">
        {SUPPORTED_LOCALES.map((item) => {
          const active = item.id === locale;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setLocale(item.id)}
              className="flex items-center gap-3 rounded-slmd px-3 py-2.5 text-left"
              style={{
                backgroundColor: active ? "var(--color-surface-raised)" : "transparent",
                outline: active ? "2px solid var(--color-brand-blue)" : "1px solid var(--color-border)",
              }}
            >
              <span className="text-xl leading-none" aria-hidden>
                {item.flag}
              </span>
              <span className="flex-1 font-body text-sm text-ink">{item.name}</span>
              <span className="font-mono text-xs text-ink-faint">{item.id}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
