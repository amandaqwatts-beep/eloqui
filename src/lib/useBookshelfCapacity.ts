/**
 * useBookshelfCapacity.ts — measures the shelf container width and derives
 * how many book spines fit on one row.
 *
 * BOOK_SLOT_WIDTH is the horizontal footprint of one spine + gap (in px).
 * It is a visual tuning constant: bump it only when the packed shelves
 * genuinely look too cramped/loose on the target widths.
 */
import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Per-book horizontal footprint. Was 52 = widest 44 + 8px gap; after the
 * thin-book pass the spines now sit FLUSH (no inter-book gap) and the widest
 * spine across EVERY kind (henle · unit-review · review · culture · explore)
 * is ~26px, so 34 gives a little headroom for the cluster divider/unit gap
 * while still packing far more books per shelf than before.
 */
export const BOOK_SLOT_WIDTH = 34;

export function useBookshelfCapacity<T extends HTMLElement>(): {
  ref: RefObject<T | null>;
  capacity: number;
} {
  const ref = useRef<T | null>(null);
  const [capacity, setCapacity] = useState(8);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setCapacity(Math.max(4, Math.floor((el.clientWidth - 48) / BOOK_SLOT_WIDTH)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, capacity };
}
