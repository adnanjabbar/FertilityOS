"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  gender: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium" });
}

export default function PatientDetailClient({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Patient>>({});

  useEffect(() => {
    fetch(`/api/app/patients/${patientId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setPatient(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          country: data.country ?? "",
          postalCode: data.postalCode ?? "",
          gender: data.gender ?? "",
          notes: data.notes ?? "",
        });
      })
      .catch(() => setError("Patient not found"))
      .finally(() => setLoading(false));
  }, [patientId]);

  const handleSave = async () => {
    if (!patient) return;
    setSaveError(null);
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/app/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName?.trim(),
          lastName: form.lastName?.trim(),
          dateOfBirth: form.dateOfBirth || null,
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          address: form.address?.trim() || null,
          city: form.city?.trim() || null,
          state: form.state?.trim() || null,
          country: form.country?.trim() || null,
          postalCode: form.postalCode?.trim() || null,
          gender: form.gender?.trim() || null,
          notes: form.notes?.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || "Failed to update");
        return;
      }
      setPatient(data);
      setForm({
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        country: data.country ?? "",
        postalCode: data.postalCode ?? "",
        gender: data.gender ?? "",
        notes: data.notes ?? "",
      });
      setEditing(false);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <div className="text-slate-500 py-8">Loading…</div>;
  if (error || !patient) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">{error ?? "Patient not found"}</p>
        <Link href="/app/patients" className="mt-4 inline-block text-blue-700 font-medium hover:underline">
          Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/app/patients"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to patients
        </Link>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saveLoading ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{saveError}</p>
        )}
        {editing ? (
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  className={inputClass}
                  value={form.firstName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  className={inputClass}
                  value={form.lastName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date of birth</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.dateOfBirth ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <input
                  className={inputClass}
                  value={form.gender ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                className={inputClass}
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input
                className={inputClass}
                value={form.address ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>City</label>
                <input className={inputClass} value={form.city ?? ""} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input className={inputClass} value={form.state ?? ""} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input className={inputClass} value={form.country ?? ""} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Postal code</label>
                <input className={inputClass} value={form.postalCode ?? ""} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                rows={3}
                className={inputClass}
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">
              {patient.firstName} {patient.lastName}
            </h1>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date of birth</dt>
                <dd className="text-slate-900 mt-0.5">{formatDate(patient.dateOfBirth)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gender</dt>
                <dd className="text-slate-900 mt-0.5">{patient.gender ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</dt>
                <dd className="text-slate-900 mt-0.5">{patient.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</dt>
                <dd className="text-slate-900 mt-0.5">{patient.phone ?? "—"}</dd>
              </div>
              {(patient.address || patient.city) && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Address</dt>
                  <dd className="text-slate-900 mt-0.5">
                    {[patient.address, [patient.city, patient.state, patient.postalCode].filter(Boolean).join(", "), patient.country]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </dd>
                </div>
              )}
              {patient.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</dt>
                  <dd className="text-slate-900 mt-0.5 whitespace-pre-wrap">{patient.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">Added</dt>
                <dd className="text-slate-900 mt-0.5">{formatDate(patient.createdAt)}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
