"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<"company" | "researcher">("researcher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, institutionName }),
      });
      const data = (await res.json()) as { error?: string; role?: "company" | "researcher" };
      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        return;
      }
      if (data.role === "company") router.push("/company/new-brief");
      else router.push("/researcher/register");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 outline-none";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
        <p className="mt-1 text-sm text-gray-600">
          Accounts are role-based: company or researcher (PhD student/PhD).
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-gray-700">Account role</legend>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={role === "researcher"} onChange={() => setRole("researcher")} />
                Researcher (PhD student / PhD)
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={role === "company"} onChange={() => setRole("company")} />
                Company
              </label>
            </div>
          </fieldset>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
            <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            {role === "researcher" ? (
              <p className="mt-1 text-xs text-gray-500">
                Researcher accounts require an institutional email address (affiliation verification).
              </p>
            ) : null}
          </div>

          {role === "researcher" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">University / institution</label>
              <input
                className={inputClass}
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              className={inputClass}
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="font-medium text-indigo-600 hover:text-indigo-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
