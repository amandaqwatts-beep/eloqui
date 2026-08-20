import { Link } from "@tanstack/react-router";
export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-burgundy-200/60 bg-cream-50/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-burgundy-700 font-book text-lg text-cream-50">
            E
          </span>
          <span className="font-book text-2xl font-extrabold tracking-tight text-burgundy-900">
            Eloqui
          </span>
        </Link>
        <span className="rounded-full bg-burgundy-50 px-3 py-1.5 text-sm font-medium text-burgundy-600">
          Latin 101
        </span>
      </div>
    </nav>
  );
}
