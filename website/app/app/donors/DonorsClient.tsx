"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Droplets } from "lucide-react";

type DonorRow = {
  id: string;
  type: string;
  donorCode: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  createdAt: string;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium" });
}

function donorTypeLabel(type: string) {
  switch (type) {
    case "egg":
      return "Egg";
    case "sperm":
      return "Sperm";
    case "embryo":
      return "Embryo";
    default:
      return type;
  }
}

export default function DonorsClient() {
  const router = useRouter();
  const [list, setList] = useState<DonorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "egg" as "egg" | "sperm" | "embryo",
    donorCode: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bloodType: "",
    notes: "",
  });

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/app/donors");
      if (res.ok) setList(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.donorCode.trim()) {
      setAddError("Donor code is required.");
      return;
    }
    setAddError(null);
    setAddLoading(true);
    try {
      const res = await fetch("/api/app/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          donorCode: form.donorCode.trim(),
          firstName: form.firstName.trim() || undefined,
          lastName: form.lastName.trim() || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          bloodType: form.bloodType.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data.error || data.details?.donorCode?.[0] || "Failed to create donor.");
        return;
      }
      setShowAddForm(false);
      setForm({
        type: "egg",
        donorCode: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        bloodType: "",
        notes: "",
      });
      router.push(`/app/donors/${data.id}`);
      fetchList();
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
          <UserPlus className="w-5 h-5" />
          Add donor
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">New donor</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {addError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{addError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className={labelClass}>Type *</label>
                <select
                  id="type"
                  className={inputClass}
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "egg" | "sperm" | "embryo" }))}
                  required
                >
                  <option value="egg">Egg</option>
                  <option value="sperm">Sperm</option>
                  <option value="embryo">Embryo</option>
                </select>
              </div>
              <div>
                <label htmlFor="donorCode" className={labelClass}>Donor code *</label>
                <input
                  id="donorCode"
                  className={inputClass}
                  value={form.donorCode}
                  onChange={(e) => setForm((f) => ({ ...f, donorCode: e.target.value }))}
                  placeholder="e.g. EGG-001"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelClass}>First name</label>
                <input
                  id="firstName"
                  className={inputClass}
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Last name</label>
                <input
                  id="lastName"
                  className={inputClass}
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className={labelClass}>Date of birth</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className={inputClass}
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="bloodType" className={labelClass}>Blood type</label>
                <input
                  id="bloodType"
                  className={inputClass}
                  value={form.bloodType}
                  onChange={(e) => setForm((f) => ({ ...f, bloodType: e.target.value }))}
                  placeholder="e.g. A+"
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className={labelClass}>Notes</label>
              <textarea
                id="notes"
                rows={3}
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
                {addLoading ? "Creating…" : "Create donor"}
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
            <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No donors yet.</p>
            <p className="text-slate-500 text-sm mt-1">Add egg, sperm, or embryo donors above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 font-medium">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Blood type</th>
                <th className="px-4 py-3">DOB</th>
                <th className="px-4 py-3">Added</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/donors/${d.id}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {d.donorCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{donorTypeLabel(d.type)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {[d.firstName, d.lastName].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.bloodType ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(d.dateOfBirth)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
