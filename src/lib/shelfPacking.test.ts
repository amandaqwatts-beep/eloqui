/**
 * shelfPacking.test.ts — unit tests for the greedy shelf packer.
 *
 * Self-contained (no bun:test import) so the project's `tsc --noEmit` stays
 * at its baseline error count without pulling in @types/bun. Run with:
 *   bun src/lib/shelfPacking.test.ts
 */
import { packShelves, type PackableUnit } from "./shelfPacking";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`(pass) ${name}`);
  } catch (e) {
    failed++;
    console.error(`(fail) ${name}`);
    console.error(e);
  }
}

function eq<T>(actual: T, expected: T, msg?: string) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg ?? "assertion"}: expected ${b}, got ${a}`);
}
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const VECTOR: PackableUnit[] = [
  { unit: 1, bookCount: 14 }, // 6 henle + 1 review + 1 culture + 6 explore
  { unit: 2, bookCount: 6 }, // 2 henle + 1 review + 1 culture + 2 explore
  { unit: 3, bookCount: 13 }, // 6 henle + 0 review + 1 culture + 6 explore
  { unit: 4, bookCount: 5 }, // 2 henle + 0 review + 1 culture + 2 explore
  { unit: 5, bookCount: 7 }, // 5 henle + 1 review + 1 culture
  { unit: 6, bookCount: 3 },
  { unit: 7, bookCount: 2 },
  { unit: 8, bookCount: 3 },
  { unit: 9, bookCount: 5 },
  { unit: 10, bookCount: 2 },
  { unit: 11, bookCount: 2 },
  { unit: 12, bookCount: 1 },
  { unit: 13, bookCount: 2 },
  { unit: 14, bookCount: 2 },
];

const units = (shelf: { units: PackableUnit[] }) => shelf.units.map((u) => u.unit);

test("worked example: capacity 12 → 7 shelves", () => {
  const packed = packShelves(VECTOR, 12);
  eq(
    packed.map(units),
    [[1], [2], [3], [4, 5], [6, 7, 8], [9, 10, 11, 12, 13], [14]],
    "shelf grouping",
  );
  ok(packed.every((s) => s.totalBooks <= 12 || s.units.length === 1), "fit or alone");
});

test("worked example: capacity 15 → 6 shelves", () => {
  const packed = packShelves(VECTOR, 15);
  eq(
    packed.map(units),
    [[1], [2], [3], [4, 5, 6], [7, 8, 9, 10, 11, 12], [13, 14]],
    "shelf grouping",
  );
});

test("boundary: unit fills capacity exactly stays merged", () => {
  const packed = packShelves(
    [
      { unit: 1, bookCount: 4 },
      { unit: 2, bookCount: 8 },
      { unit: 3, bookCount: 2 },
    ],
    12,
  );
  eq(packed.map(units), [[1, 2], [3]], "shelf grouping");
  eq(packed[0].totalBooks, 12, "exact fill");
});

test("oversized unit sits alone on its own shelf", () => {
  const packed = packShelves(
    [
      { unit: 1, bookCount: 2 },
      { unit: 2, bookCount: 20 },
      { unit: 3, bookCount: 3 },
    ],
    12,
  );
  eq(packed.map(units), [[1], [2], [3]], "shelf grouping");
  eq(packed[1].units.map((u) => u.unit), [2], "oversized alone");
  eq(packed[1].totalBooks, 20, "oversized total");
});

test("empty input → empty result", () => {
  eq(packShelves([], 12), [], "empty");
});

test("capacity 1 → one unit per shelf (all bookCounts ≥ 1)", () => {
  const packed = packShelves(VECTOR, 1);
  eq(packed.length, VECTOR.length, "shelf count");
  ok(packed.every((s) => s.units.length === 1), "one unit per shelf");
});

test("capacity ≤ 0 → one unit per shelf", () => {
  eq(packShelves(VECTOR, 0).length, VECTOR.length, "capacity 0");
  eq(packShelves(VECTOR, -3).length, VECTOR.length, "negative capacity");
});

test("shelfIndex is the index in the returned array", () => {
  const packed = packShelves(VECTOR, 12);
  packed.forEach((shelf, i) => eq(shelf.shelfIndex, i, `shelf ${i}`));
});

test("adjacent-merge only — never reorders units", () => {
  const packed = packShelves(VECTOR, 12);
  const flat = packed.flatMap((s) => s.units.map((u) => u.unit));
  eq(flat, VECTOR.map((u) => u.unit), "order preserved");
});

if (failed > 0) {
  console.error(`${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`${passed} passed`);
