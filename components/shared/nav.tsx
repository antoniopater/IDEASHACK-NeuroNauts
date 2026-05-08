import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-session";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white hover:text-indigo-300 transition-colors"
        >
          <span className="text-indigo-400">N</span>exdoc
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link href="/briefs" className="text-slate-400 hover:text-white transition-colors hidden sm:block">
            R&D Briefs
          </Link>
          <Link href="/researchers" className="text-slate-400 hover:text-white transition-colors hidden sm:block">
            Researchers
          </Link>

          {user ? (
            <>
              {user.role === "researcher" && user.researcher_id ? (
                <>
                  <Link
                    href={`/researcher/${user.researcher_id}/dashboard`}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={`/researcher/${user.researcher_id}`}
                    className="text-slate-400 hover:text-white transition-colors hidden sm:block"
                  >
                    My profile
                  </Link>
                </>
              ) : null}
              {user.role === "company" ? (
                <>
                  <Link href="/company/dashboard" className="text-slate-400 hover:text-white transition-colors">Dashboard</Link>
                  <Link href="/company/new-brief" className="text-slate-400 hover:text-white transition-colors hidden sm:block">New brief</Link>
                </>
              ) : null}
              <Link
                href="/api/auth/logout"
                prefetch={false}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 hover:bg-white/10 transition-colors text-xs font-medium"
              >
                Sign out
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/researcher/register"
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
