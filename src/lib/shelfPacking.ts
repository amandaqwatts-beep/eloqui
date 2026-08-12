/**
 * shelfPacking.ts — greedy shelf packing for the Bookshelf v2 layout.
 *
 * Pure function, no React, no rendering. Units (1..14) arrive in ascending
 * unit order; adjacent units are merged onto one physical shelf while their
 * combined book count fits the shelf capacity. A single unit whose bookCount
 * already exceeds capacity sits alone on its own shelf (its book cluster
 * flex-wraps to extra rows instead).
 *
 * Contract (ratified bookshelf-v2 design):
 *   - empty input            → []
 *   - capacity <= 0          → one unit per shelf
 *   - unit.bookCount > cap   → that unit sits alone on its shelf
 *   - shelfIndex             → index in the returned array (0-based)
 */
export interface PackableUnit {
  unit: number;
  bookCount: number;
}

export interface PackedShelf {
  shelfIndex: number;
  units: PackableUnit[];
  totalBooks: number;
}

export function packShelves(units: PackableUnit[], capacity: number): PackedShelf[] {
  if (units.length === 0) return [];
  if (capacity <= 0) {
    return units.map((u, i) => ({ shelfIndex: i, units: [u], totalBooks: u.bookCount }));
  }

  const shelves: PackedShelf[] = [];
  let current: PackedShelf | null = null;

  const flush = () => {
    if (current) {
      shelves.push(current);
      current = null;
    }
  };

  for (const u of units) {
    if (u.bookCount > capacity) {
      // Oversized unit sits alone (its cluster flex-wraps within the shelf).
      flush();
      shelves.push({ shelfIndex: shelves.length, units: [u], totalBooks: u.bookCount });
      continue;
    }
    if (current && current.totalBooks + u.bookCount <= capacity) {
      current.units.push(u);
      current.totalBooks += u.bookCount;
    } else {
      flush();
      current = { shelfIndex: shelves.length, units: [u], totalBooks: u.bookCount };
    }
  }
  flush();
  return shelves;
}
