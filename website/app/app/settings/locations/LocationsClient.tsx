"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

type Location = {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  timezone: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

const emptyForm = {
  name: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  timezone: "",
  isDefault: false,
};

export default function LocationsClient() {
  const [list, setList] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    const res = await fetch("/api/app/locations");
    if (res.ok) setList(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setMessage(null);
  };

  const openEdit = (loc: Location) => {
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      address: loc.address ?? "",
      city: loc.city ?? "",
      state: loc.state ?? "",
      country: loc.country ?? "",
      postalCode: loc.postalCode ?? "",
      timezone: loc.timezone ?? "",
      isDefault: loc.isDefault,
    });
    setShowForm(true);
    setMessage(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Name is required." });
      return;
    }
    setSaveLoading(true);
    setMessage(null);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        timezone: form.timezone.trim() || undefined,
        isDefault: form.isDefault,
      };
      if (editingId) {
        const res = await fetch(`/api/app/locations/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({ type: "error", text: data.error || "Failed to update location." });
          return;
        }
        setMessage({ type: "success", text: "Location updated." });
      } else {
        const res = await fetch("/api/app/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({ type: "error", text: data.error || "Failed to create location." });
          return;
        }
        setMessage({ type: "success", text: "Location created." });
      }
      closeForm();
      fetchList();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/app/locations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "error", text: data.error || "Failed to delete location." });
      return;
    }
    setDeleteConfirmId(null);
    setMessage({ type: "success", text: "Location deleted." });
    fetchList();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Locations
            </span>
          </h1>
          <p className="text-slate-600 mt-1">
            Manage clinic locations. Use locations to scope appointments and reports.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add location
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">
            {editingId ? "Edit location" : "New location"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className={labelClass}>Name *</label>
              <input
                id="name"
                type="text"
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Main Clinic"
                required
              />
            </div>
            <div>
              <label htmlFor="address" className={labelClass}>Address</label>
              <input
                id="address"
                type="text"
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className={labelClass}>City</label>
                <input
                  id="city"
                  type="text"
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>State / Province</label>
                <input
                  id="state"
                  type="text"
                  className={inputClass}
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="postalCode" className={labelClass}>Postal code</label>
                <input
                  id="postalCode"
                  type="text"
                  className={inputClass}
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className={labelClass}>Country (ISO 2)</label>
                <input
                  id="country"
                  type="text"
                  className={inputClass}
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase().slice(0, 2) }))}
                  placeholder="e.g. US"
                  maxLength={2}
                />
              </div>
              <div>
                <label htmlFor="timezone" className={labelClass}>Timezone</label>
                <input
                  id="timezone"
                  type="text"
                  className={inputClass}
                  value={form.timezone}
                  onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                  placeholder="e.g. America/New_York"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isDefault"
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-400"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-slate-700">
                Default location (for new appointments when none selected)
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
              >
                {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? "Update location" : "Create location"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No locations yet</p>
            <p className="text-slate-500 text-sm mt-1">Add a location to scope appointments and reports by site.</p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add location
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((loc) => (
              <li key={loc.id} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-slate-50/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{loc.name}</span>
                    {loc.isDefault && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                  {(loc.address || loc.city) && (
                    <p className="text-sm text-slate-500 mt-0.5 truncate">
                      {[loc.address, loc.city, loc.state, loc.postalCode].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(loc)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {deleteConfirmId === loc.id ? (
                    <span className="flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => handleDelete(loc.id)}
                        className="px-2 py-1 rounded bg-red-600 text-white text-xs font-medium"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 rounded border border-slate-200 text-slate-600 text-xs"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(loc.id)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
