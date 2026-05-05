import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-gray-900 hover:text-indigo-700"
        >
          RD Bridge
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 text-sm">
          <Link href="/company/new-brief" className="text-gray-700 hover:text-indigo-700">
            Jestem firmą
          </Link>
          <Link href="/researcher/register" className="text-gray-700 hover:text-indigo-700">
            Jestem badaczem
          </Link>
        </nav>
      </div>
    </header>
  );
}
