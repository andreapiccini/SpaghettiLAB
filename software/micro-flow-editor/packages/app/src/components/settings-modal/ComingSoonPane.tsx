import type { SettingsCategoryId } from "../../lib/settings-catalog.js";
import { chromeCopy } from "../../lib/chrome-copy.js";
import { useLocale } from "../../state/locale-context.js";

export function ComingSoonPane({ categoryId }: { readonly categoryId: SettingsCategoryId }) {
  const { locale } = useLocale();
  const copy = chromeCopy(locale);
  const category = copy.categories[categoryId];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-ink">{category.title}</h2>
      <p className="mt-1 font-body text-sm text-ink-muted">{category.subtitle}</p>
      <p className="mt-8 max-w-md font-body text-sm text-ink-faint">
        {copy.comingSoon}. {copy.comingSoonBody}
      </p>
    </div>
  );
}
