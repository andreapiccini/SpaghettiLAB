import { NodeRedRuntimeBar } from "../../cross-core-automation/NodeRedRuntimeBar.js";
import { chromeCopy } from "../../../lib/chrome-copy.js";
import { useLocale } from "../../../state/locale-context.js";

export function NodeRedPane() {
  const { locale } = useLocale();
  const copy = chromeCopy(locale);

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-ink">{copy.categories.nodered.title}</h2>
      <p className="mt-1 font-body text-sm text-ink-muted">{copy.categories.nodered.subtitle}</p>
      <div className="mt-6 rounded-slmd border border-border p-4">
        <NodeRedRuntimeBar />
      </div>
    </div>
  );
}
