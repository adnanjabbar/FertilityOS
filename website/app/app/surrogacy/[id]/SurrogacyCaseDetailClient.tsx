"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type CaseDetail = {
  id: string;
  tenantId: string;
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

export default function SurrogacyCaseDetailClient({ caseId }: { caseId: string }) {
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    intendedParentPatientId: "",
    surrogateName: "",
    surrogateContact: "",
    status: "matching",
    startDate: "",
    dueDate: "",
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/app/surrogacy-cases/${caseId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: CaseDetail) => {
        setCaseDetail(data);
        setEditForm({
          intendedParentPatientId: data.intendedParentPatientId,
          surrogateName: data.surrogateName,
          surrogateContact: data.surrogateContact ?? "",
          status: data.status,
          startDate: data.startDate ? data.startDate.slice(0, 10) : "",
          dueDate: data.dueDate ? data.dueDate.slice(0, 10) : "",
          notes: data.notes ?? "",
        });
      })
      .catch(() => setError("Case not found"))
      .finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => {
    fetch("/api/app/patients")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: string; firstName: string; lastName: string }[]) =>
        setPatients(
          data.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
          }))
        )
      )
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseDetail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/app/surrogacy-cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intendedParentPatientId: editForm.intendedParentPatientId,
          surrogateName: editForm.surrogateName.trim(),
          surrogateContact: editForm.surrogateContact.trim() || null,
          status: editForm.status,
          startDate: editForm.startDate || null,
          dueDate: editForm.dueDate || null,
          notes: editForm.notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to update");
        return;
      }
      const refetch = await fetch(`/api/app/surrogacy-cases/${caseId}`);
      if (refetch.ok) {
        const updated = await refetch.json();
        setCaseDetail(updated);
        setEditForm({
          intendedParentPatientId: updated.intendedParentPatientId,
          surrogateName: updated.surrogateName,
          surrogateContact: updated.surrogateContact ?? "",
          status: updated.status,
          startDate: updated.startDate ? updated.startDate.slice(0, 10) : "",
          dueDate: updated.dueDate ? updated.dueDate.slice(0, 10) : "",
          notes: updated.notes ?? "",
        });
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (error || !caseDetail) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error ?? "Case not found"}</p>
        <Link
          href="/app/surrogacy"
          className="text-blue-700 hover:underline mt-2 inline-block"
        >
          Back to surrogacy cases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/app/surrogacy"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Surrogacy cases
        </Link>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="surrogacy-edit-form"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">{caseDetail.caseNumber}</h1>
          <p className="text-slate-600 mt-1">
            <Link
              href={`/app/patients/${caseDetail.intendedParentPatientId}`}
              className="text-blue-700 hover:underline"
            >
              {caseDetail.intendedParentFirstName} {caseDetail.intendedParentLastName}
            </Link>
            {" · "}Intended parent
          </p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <span>
              <span className="text-slate-500">Surrogate:</span>{" "}
              <span className="font-medium text-slate-900">{caseDetail.surrogateName}</span>
            </span>
            <span>
              <span className="text-slate-500">Status:</span>{" "}
              <span
                className={`font-medium ${
                  caseDetail.status === "delivered"
                    ? "text-green-700"
                    : caseDetail.status === "pregnant"
                      ? "text-blue-700"
                      : "text-slate-700"
                }`}
              >
                {caseDetail.status}
              </span>
            </span>
            <span>
              <span className="text-slate-500">Start:</span>{" "}
              {formatDate(caseDetail.startDate)}
            </span>
            <span>
              <span className="text-slate-500">Due:</span>{" "}
              {formatDate(caseDetail.dueDate)}
            </span>
          </div>
        </div>

        {editing ? (
          <form
            id="surrogacy-edit-form"
            onSubmit={handleSave}
            className="p-6 space-y-4 border-t border-slate-200"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Intended parent (patient)</label>
                <select
                  className={inputClass}
                  value={editForm.intendedParentPatientId}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      intendedParentPatientId: e.target.value,
                    }))
                  }
                >
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
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value }))
                  }
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
                <label className={labelClass}>Surrogate name</label>
                <input
                  type="text"
                  className={inputClass}
                  value={editForm.surrogateName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, surrogateName: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Surrogate contact</label>
                <input
                  type="text"
                  className={inputClass}
                  value={editForm.surrogateContact}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, surrogateContact: e.target.value }))
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
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Due date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={editForm.dueDate}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                rows={3}
                className={inputClass}
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </form>
        ) : (
          <div className="p-6">
            {caseDetail.surrogateContact && (
              <div className="mb-4">
                <p className="text-sm text-slate-500">Surrogate contact</p>
                <p className="text-slate-900 whitespace-pre-wrap">
                  {caseDetail.surrogateContact}
                </p>
              </div>
            )}
            {caseDetail.notes && (
              <div>
                <p className="text-sm text-slate-500">Notes</p>
                <p className="text-slate-900 whitespace-pre-wrap">{caseDetail.notes}</p>
              </div>
            )}
            {!caseDetail.surrogateContact && !caseDetail.notes && (
              <p className="text-slate-500 text-sm">No contact or notes recorded.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
