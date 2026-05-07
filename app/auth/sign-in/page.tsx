"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        role?: "company" | "researcher";
        researcher_id?: string | null;
      };
      if (!res.ok) {
        setError(data.error || "Sign-in failed.");
        return;
      }
      if (data.role === "company") {
        router.push("/company/new-brief");
      } else if (data.researcher_id) {
        router.push(`/researcher/${data.researcher_id}/dashboard`);
      } else {
        router.push("/researcher/register");
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 outline-none text-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-16 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-white">
            <span className="text-indigo-400">N</span>exdoc
          </Link>
          <p className="mt-2 text-slate-400 text-sm">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-5">
            {error ? (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            ) : null}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">E-mail</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                type="email"
                required
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-xs text-slate-500 text-center mb-3">Demo accounts (password: demo1234)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setEmail("k.nowak@doktorant.pw.edu.pl"); setPassword("demo1234"); }}
                className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1.5 text-indigo-300 hover:bg-indigo-500/20 transition-colors text-left"
              >
                🎓 Kamil Nowak (PW)
              </button>
              <button
                type="button"
                onClick={() => { setEmail("m.kowalczyk@uj.edu.pl"); setPassword("demo1234"); }}
                className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1.5 text-indigo-300 hover:bg-indigo-500/20 transition-colors text-left"
              >
                🎓 Marta Kowalczyk (UJ)
              </button>
              <button
                type="button"
                onClick={() => { setEmail("p.wisniewski@pwr.edu.pl"); setPassword("demo1234"); }}
                className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1.5 text-indigo-300 hover:bg-indigo-500/20 transition-colors text-left"
              >
                🎓 Piotr Wisniewski (PWr)
              </button>
              <button
                type="button"
                onClick={() => { setEmail("a.zielinska@amu.edu.pl"); setPassword("demo1234"); }}
                className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1.5 text-indigo-300 hover:bg-indigo-500/20 transition-colors text-left"
              >
                🎓 Anna Zielinska (AMU)
              </button>
              <button
                type="button"
                onClick={() => { setEmail("t.grabowski@agh.edu.pl"); setPassword("demo1234"); }}
                className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1.5 text-indigo-300 hover:bg-indigo-500/20 transition-colors text-left"
              >
                🎓 Tomasz Grabowski (AGH)
              </button>
              <button
                type="button"
                onClick={() => { setEmail("rd@ttpsc.pl"); setPassword("demo1234"); }}
                className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-violet-300 hover:bg-violet-500/20 transition-colors text-left"
              >
                🏢 TTPSC (IT)
              </button>
              <button
                type="button"
                onClick={() => { setEmail("innovation@polpharma.com"); setPassword("demo1234"); }}
                className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-violet-300 hover:bg-violet-500/20 transition-colors text-left"
              >
                🏢 Polpharma (Biotech)
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account yet?{" "}
          <Link href="/auth/sign-up" className="font-medium text-indigo-400 hover:text-indigo-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
