"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Patient = { id: string; firstName: string; lastName: string };
type LabTest = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  unit: string | null;
  referenceRangeLow: string | null;
  referenceRangeHigh: string | null;
  referenceRangeMaleLow: string | null;
  referenceRangeMaleHigh: string | null;
  referenceRangeFemaleLow: string | null;
  referenceRangeFemaleHigh: string | null;
  isPanel: boolean;
};

export default function NewLabOrderClient() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patientId, setPatientId] = useState("");
  const [testIds, setTestIds] = useState<Set<string>>(new Set());
  const [testSearch, setTestSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTests = tests.filter(
    (t) =>
      !t.isPanel &&
      (testSearch.trim() === "" ||
        [t.code, t.name, t.category].some(
          (x) => x && String(x).toLowerCase().includes(testSearch.toLowerCase())
        )
      )
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/app/patients").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/app/lab/tests").then((r) => (r.ok ? r.json() : [])),
    ]).then(([pList, tList]) => {
      setPatients(Array.isArray(pList) ? pList : []);
      setTests(Array.isArray(tList) ? tList : []);
      setLoading(false);
    });
  }, []);

  const toggleTest = (id: string) => {
    setTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!patientId || testIds.size === 0) {
      setError("Select a patient and at least one test.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/app/lab/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, testIds: Array.from(testIds) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to create order.");
        return;
      }
      router.push(`/app/lab/orders/${data.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Patient</label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-400"
          required
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {[p.firstName, p.lastName].filter(Boolean).join(" ") || p.id}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Tests (NABL-style catalog)</label>
        {tests.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No tests in catalog. Run: <code className="bg-amber-100 px-1">node scripts/seed-lab-tests-nabl.js</code> from
            the <code className="bg-amber-100 px-1">website</code> folder to load the default NABL-style test list.
          </p>
        ) : (
          <>
            <input
              type="search"
              placeholder="Search by code, name, or category…"
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400"
            />
            <ul className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
              {filteredTests.map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={t.id}
                    checked={testIds.has(t.id)}
                    onChange={() => toggleTest(t.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
                  />
                  <label htmlFor={t.id} className="cursor-pointer text-sm">
                    <span className="font-medium text-slate-900">
                      {t.code} — {t.name}
                    </span>
                    {t.category && (
                      <span className="ml-2 text-xs text-slate-500">({t.category})</span>
                    )}
                    {t.unit && <span className="text-slate-600"> · {t.unit}</span>}
                    {(t.referenceRangeMaleLow != null || t.referenceRangeFemaleLow != null) && (
                      <span className="block mt-0.5 text-xs text-slate-500">
                        Male: {t.referenceRangeMaleLow ?? "—"}–{t.referenceRangeMaleHigh ?? "—"}
                        {" · "}
                        Female: {t.referenceRangeFemaleLow ?? "—"}–{t.referenceRangeFemaleHigh ?? "—"}
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
            {filteredTests.length === 0 && testSearch.trim() !== "" && (
              <p className="mt-2 text-sm text-slate-500">No tests match &quot;{testSearch}&quot;</p>
            )}
          </>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || testIds.size === 0}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create order"}
        </button>
        <Link
          href="/app/lab"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
