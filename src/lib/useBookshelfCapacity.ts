/**
 * useBookshelfCapacity.ts — measures the shelf container width and derives
 * how many book spines fit on one row.
 *
 * BOOK_SLOT_WIDTH is the horizontal footprint of one spine + gap (in px).
 * It is a visual tuning constant: bump it only when the packed shelves
 * genuinely look too cramped/loose on the target widths.
 */
import { useEffect, useRef, useState, type RefObject } from "react";

export const BOOK_SLOT_WIDTH = 52;

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
