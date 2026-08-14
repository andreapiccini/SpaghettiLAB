/**
 * A small hover label for an icon-only button — place inside a button with
 * `className="group relative ..."`. Native `title` tooltips exist on the
 * same buttons too (screen readers, and a fallback if this is ever
 * clipped by an ancestor's `overflow: hidden`), but they're slow to appear
 * and easy to miss; this shows immediately on hover so an icon-only
 * toolbar (Physical Composition's node palette, the collapsed left rail)
 * doesn't leave the user guessing what each icon means.
 */
export function IconTooltip({ label, side = "right" }: { readonly label: string; readonly side?: "right" | "bottom" }) {
  const position = side === "right" ? "left-full top-1/2 ml-2 -translate-y-1/2" : "left-1/2 top-full mt-2 -translate-x-1/2";
  return (
    <span
      className={`pointer-events-none absolute ${position} z-50 whitespace-nowrap rounded-slsm bg-ink px-2 py-1 font-body text-xs text-white opacity-0 shadow-e2 transition-opacity duration-150 group-hover:opacity-100`}
    >
      {label}
    </span>
  );
}
