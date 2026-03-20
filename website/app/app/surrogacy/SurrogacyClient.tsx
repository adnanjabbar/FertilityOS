"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Baby, Plus } from "lucide-react";
import { loadAllPatientOptionsForSelect } from "@/lib/patient-select-options";

type SurrogacyCaseRow = {
  id: string;
  caseNumber: string;
  intendedParentPatientId: string;
  intendedParentFirstName: string;
  intendedParentLastName: string;
  surrogateName: string;
  surrogateContact: string | null;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type PatientOption = { id: string; firstName: string; lastName: string };

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

const STATUS_OPTIONS = [
  { value: "matching", label: "Matching" },
  { value: "pregnant", label: "Pregnant" },
  { value: "delivered", label: "Delivered" },
  { value: "closed", label: "Closed" },
] as const;

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function SurrogacyClient() {
  const [list, setList] = useState<SurrogacyCaseRow[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({
    intendedParentPatientId: "",
    surrogateName: "",
    surrogateContact: "",
    status: "matching",
    startDate: "",
    dueDate: "",
    notes: "",
  });

  const fetchPatients = useCallback(async () => {
    try {
      setPatients(await loadAllPatientOptionsForSelect());
    } catch {
      setPatients([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/app/surrogacy-cases");
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(fetchList, 200);
    return () => clearTimeout(t);
  }, [fetchList]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.intendedParentPatientId) {
      setAddError("Select an intended parent (patient).");
      return;
    }
    if (!form.surrogateName.trim()) {
      setAddError("Surrogate name is required.");
      return;
    }
    setAddError(null);
    setAddLoading(true);
    try {
      const res = await fetch("/api/app/surrogacy-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intendedParentPatientId: form.intendedParentPatientId,
          surrogateName: form.surrogateName.trim(),
          surrogateContact: form.surrogateContact.trim() || null,
          status: form.status,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data.error || "Failed to create case.");
        return;
      }
      setShowAddForm(false);
      setForm({
        intendedParentPatientId: "",
        surrogateName: "",
        surrogateContact: "",
        status: "matching",
        startDate: "",
        dueDate: "",
        notes: "",
      });
      fetchList();
      if (data.id) window.location.href = `/app/surrogacy/${data.id}`;
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add case
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">New surrogacy case</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {addError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{addError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Intended parent (patient) *</label>
                <select
                  className={inputClass}
                  value={form.intendedParentPatientId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, intendedParentPatientId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Surrogate name *</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Full name"
                  value={form.surrogateName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, surrogateName: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Surrogate contact</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Phone, email, or notes"
                  value={form.surrogateContact}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, surrogateContact: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Start date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Due date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                rows={2}
                className={inputClass}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading}
                className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-60"
              >
                {addLoading ? "Creating…" : "Create case"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Baby className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No surrogacy cases yet.</p>
            <p className="text-slate-500 text-sm mt-1">Add a case above to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 font-medium">
                <th className="px-4 py-3">Case #</th>
                <th className="px-4 py-3">Intended parent</th>
                <th className="px-4 py-3">Surrogate</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">Due</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/surrogacy/${c.id}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {c.caseNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <Link
                      href={`/app/patients/${c.intendedParentPatientId}`}
                      className="text-blue-700 hover:underline"
                    >
                      {c.intendedParentFirstName} {c.intendedParentLastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-900">{c.surrogateName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        c.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : c.status === "pregnant"
                            ? "bg-blue-100 text-blue-800"
                            : c.status === "closed"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(c.startDate)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(c.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
