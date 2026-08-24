import { useEffect, useState } from "react";

/** Live `getBoundingClientRect()` of a `[data-tour-target="…"]` element — shared by `TourOverlay` and `NextStepHint`, both of which point at the same LeftRail/TopBar targets. */
export function useTargetRect(target: string | undefined): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    function measure() {
      if (!target) {
        setRect(null);
        return;
      }
      const el = document.querySelector(`[data-tour-target="${target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    }
    window.addEventListener("resize", measure);
    // Deferred rather than an immediate synchronous call — the target may not
    // have painted yet on the very first tick after a step/target change, so
    // this measures on the next frame(s) instead of guessing it's already there.
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(measure));
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [target]);

  return rect;
}
