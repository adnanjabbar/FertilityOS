"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";

type Donor = {
  id: string;
  tenantId: string;
  type: string;
  donorCode: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
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

export default function DonorDetailClient({ donorId }: { donorId: string }) {
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Donor>>({});

  useEffect(() => {
    fetch(`/api/app/donors/${donorId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setDonor(data);
        setForm({
          type: data.type,
          donorCode: data.donorCode,
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
          bloodType: data.bloodType ?? "",
          notes: data.notes ?? "",
        });
      })
      .catch(() => setError("Donor not found"))
      .finally(() => setLoading(false));
  }, [donorId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donor) return;
    setSaveError(null);
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/app/donors/${donorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          donorCode: form.donorCode?.trim(),
          firstName: form.firstName?.trim() || null,
          lastName: form.lastName?.trim() || null,
          dateOfBirth: form.dateOfBirth || null,
          bloodType: form.bloodType?.trim() || null,
          notes: form.notes?.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || "Failed to update donor.");
        return;
      }
      setDonor(data);
      setForm({
        type: data.type,
        donorCode: data.donorCode,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        bloodType: data.bloodType ?? "",
        notes: data.notes ?? "",
      });
      setEditing(false);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }
  if (error || !donor) {
    return (
      <div className="space-y-4">
        <Link href="/app/donors" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to donors
        </Link>
        <p className="text-red-600">{error ?? "Donor not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/app/donors" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-700 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to donors
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {donor.donorCode}
            <span className="ml-2 text-sm font-normal text-slate-500">
              {donorTypeLabel(donor.type)} donor
            </span>
          </h2>
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
                onClick={() => {
                  setEditing(false);
                  setForm({
                    type: donor.type,
                    donorCode: donor.donorCode,
                    firstName: donor.firstName ?? "",
                    lastName: donor.lastName ?? "",
                    dateOfBirth: donor.dateOfBirth ? donor.dateOfBirth.slice(0, 10) : "",
                    bloodType: donor.bloodType ?? "",
                    notes: donor.notes ?? "",
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                form="donor-edit-form"
                disabled={saveLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white font-medium hover:bg-blue-800 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <form id="donor-edit-form" onSubmit={handleSave} className="p-6 space-y-4">
            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{saveError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className={labelClass}>Type</label>
                <select
                  id="type"
                  className={inputClass}
                  value={form.type ?? donor.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="egg">Egg</option>
                  <option value="sperm">Sperm</option>
                  <option value="embryo">Embryo</option>
                </select>
              </div>
              <div>
                <label htmlFor="donorCode" className={labelClass}>Donor code</label>
                <input
                  id="donorCode"
                  className={inputClass}
                  value={form.donorCode ?? donor.donorCode}
                  onChange={(e) => setForm((f) => ({ ...f, donorCode: e.target.value }))}
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
                  value={form.firstName ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Last name</label>
                <input
                  id="lastName"
                  className={inputClass}
                  value={form.lastName ?? ""}
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
                  value={form.dateOfBirth ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="bloodType" className={labelClass}>Blood type</label>
                <input
                  id="bloodType"
                  className={inputClass}
                  value={form.bloodType ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, bloodType: e.target.value }))}
                  placeholder="e.g. A+"
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className={labelClass}>Notes</label>
              <textarea
                id="notes"
                rows={4}
                className={inputClass}
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </form>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Type</p>
              <p className="text-slate-900 font-medium mt-0.5">{donorTypeLabel(donor.type)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Donor code</p>
              <p className="text-slate-900 font-medium mt-0.5">{donor.donorCode}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Name</p>
              <p className="text-slate-900 font-medium mt-0.5">
                {[donor.firstName, donor.lastName].filter(Boolean).join(" ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date of birth</p>
              <p className="text-slate-900 font-medium mt-0.5">{formatDate(donor.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Blood type</p>
              <p className="text-slate-900 font-medium mt-0.5">{donor.bloodType ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Created</p>
              <p className="text-slate-900 font-medium mt-0.5">{formatDate(donor.createdAt)}</p>
            </div>
            {donor.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Notes</p>
                <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{donor.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
