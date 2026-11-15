/**
 * /shelf/$language — the language SHELF page (shelf-book architecture).
 *
 * ?book=2 deep-links straight into Book 2's shell. The shelf itself renders
 * ShelfView; Book 2's shell is composed here so the shelf stays presentational.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import type { Language } from "~/data/languages";
import { shelfForLanguage } from "~/data/shelves";
import ShelfView from "~/components/ShelfView";
import Book2Shell from "~/components/Book2Shell";
import Book3Shell from "~/components/Book3Shell";

export const Route = createFileRoute("/shelf/$language")({
  // Optional keys (`book?: number`, `section?: string`) keep the search prop
  // optional on Links. `section` is Book 2's deep-link address
  // (?book=2&section=… — uniform-menu step 2); the shell validates it
  // against the capture pipeline's data.
  validateSearch: (search: Record<string, unknown>): { book?: number; section?: string } => {
    const n =
      typeof search.book === "number"
        ? search.book
        : typeof search.book === "string" && search.book !== ""
          ? Number(search.book)
          : NaN;
    return {
      book: n === 2 || n === 3 ? n : undefined,
      section:
        typeof search.section === "string" && search.section.trim() !== ""
          ? search.section
          : undefined,
    };
  },
  component: ShelfRoute,
});

function ShelfRoute() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const shelf = shelfForLanguage(params.language as Language);

  if (!shelf) {
    // Defensive: only reachable by editing the URL — every shelf-ful language
    // is re-pointed at the hub; languages without a shelf keep their own page.
    return (
      <main className="min-h-screen bg-cream-50 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <Link to="/languages" className="text-sm font-semibold text-burgundy-800">
            ← Languages
          </Link>
          <h1 className="mt-8 text-3xl font-bold text-burgundy-900">No shelf yet</h1>
          <p className="mt-3 text-gray-600">
            This language has no bookshelf in the library yet — its course opens
            directly from the languages page.
          </p>
        </div>
      </main>
    );
  }

  if (search.book === 2) {
    // Book 2's uniform menu (screens dept): the thin shell composes the
    // BookStructureModel + session affordances (🪲 / resume / section
    // deep-links) and renders through the shared LessonMenu path.
    return <Book2Shell shelf={shelf} deepLinkSection={search.section} />;
  }

  if (search.book === 3) {
    // Book 3's study room: the Gallic War original — structure only until
    // the capture pipeline lands the adapted text.
    return <Book3Shell shelf={shelf} />;
  }

  return <ShelfView shelf={shelf} />;
}
