"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Search, ShieldAlert } from "lucide-react";

type Row = {
  patientId: string;
  firstName: string;
  lastName: string;
  mrNumber: string | null;
  email: string | null;
  phone: string | null;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
};

export default function SuperPatientSearchClient() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Row[]>([]);
  const [hint, setHint] = useState<string | null>(null);

  const search = useCallback(async () => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setHint("Type at least 2 characters.");
      return;
    }
    setLoading(true);
    setHint(null);
    try {
      const res = await fetch(`/api/app/super/patient-search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResults([]);
        setHint(data.error || "Search failed.");
        return;
      }
      setResults(data.results ?? []);
      if (data.message) setHint(data.message);
    } finally {
      setLoading(false);
    }
  }, [q]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/super" className="text-sm font-semibold text-blue-700 hover:underline">
          ← Platform overview
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Cross-clinic patient lookup</h1>
        <p className="text-slate-600 mt-1 text-sm max-w-3xl flex gap-2 items-start">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            For platform support only. Each search is audited (query length and result count only—no
            names in logs). Use clinic context when contacting a site; follow HIPAA minimum necessary.
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[240px]">
          <label htmlFor="super-patient-q" className="block text-sm font-semibold text-slate-700 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="super-patient-q"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-400"
              placeholder="Name, email, MR#, or phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void search()}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void search()}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {hint && <p className="text-sm text-slate-500">{hint}</p>}

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-600">
                <th className="px-3 py-3">Patient</th>
                <th className="px-3 py-3">MR#</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Clinic</th>
                <th className="px-3 py-3 text-right">Open clinic</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={`${r.tenantId}-${r.patientId}`} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {r.firstName} {r.lastName}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{r.mrNumber ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    <div>{r.email ?? "—"}</div>
                    <div className="text-slate-500">{r.phone ?? ""}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-slate-800">{r.tenantName}</span>
                    <div className="text-xs text-slate-500 font-mono">{r.tenantSlug}</div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/app/super/tenants/${r.tenantId}`}
                      className="text-blue-700 font-semibold hover:underline text-xs"
                    >
                      Tenant
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && q.trim().length >= 2 && results.length === 0 && !hint && (
        <p className="text-slate-500 text-sm">No matches.</p>
      )}
    </div>
  );
}
