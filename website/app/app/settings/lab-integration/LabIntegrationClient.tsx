"use client";

import { useState, useEffect, useCallback } from "react";
import { TestTubes, Plus, Pencil, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";

export type LabConnector = {
  id: string;
  name: string;
  type: "lis" | "lims";
  provider: string;
  config: Record<string, unknown>;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const PROVIDERS = [
  { value: "hl7_fhir", label: "HL7 FHIR" },
  { value: "custom_api", label: "Custom API" },
  { value: "file_import", label: "File import" },
] as const;

const TYPES = [
  { value: "lis", label: "LIS" },
  { value: "lims", label: "LIMS" },
] as const;

const labelClass = "block text-sm font-semibold text-slate-700 mb-1";
const inputClass =
  "w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

export default function LabIntegrationClient() {
  const [connectors, setConnectors] = useState<LabConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modal, setModal] = useState<"none" | "add" | "edit">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"lis" | "lims">("lis");
  const [formProvider, setFormProvider] = useState("hl7_fhir");
  const [formConfigEndpoint, setFormConfigEndpoint] = useState("");
  const [formConfigAuthHeader, setFormConfigAuthHeader] = useState("");
  const [formConfigLabId, setFormConfigLabId] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchConnectors = useCallback(() => {
    fetch("/api/app/lab-connectors")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setConnectors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  const openAdd = () => {
    setFormName("");
    setFormType("lis");
    setFormProvider("hl7_fhir");
    setFormConfigEndpoint("");
    setFormConfigAuthHeader("");
    setFormConfigLabId("");
    setFormIsActive(true);
    setEditingId(null);
    setModal("add");
  };

  const openEdit = (c: LabConnector) => {
    setFormName(c.name);
    setFormType(c.type);
    setFormProvider(c.provider);
    const cfg = (c.config || {}) as Record<string, string>;
    setFormConfigEndpoint(cfg.endpoint ?? "");
    setFormConfigAuthHeader(cfg.authHeader ?? "");
    setFormConfigLabId(cfg.labId ?? "");
    setFormIsActive(c.isActive);
    setEditingId(c.id);
    setModal("edit");
  };

  const closeModal = () => {
    setModal("none");
    setEditingId(null);
  };

  const getConfigFromForm = () => {
    const config: Record<string, string> = {};
    if (formConfigEndpoint.trim()) config.endpoint = formConfigEndpoint.trim();
    if (formConfigAuthHeader.trim()) config.authHeader = formConfigAuthHeader.trim();
    if (formConfigLabId.trim()) config.labId = formConfigLabId.trim();
    return config;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const body = {
        name: formName.trim(),
        type: formType,
        provider: formProvider,
        config: getConfigFromForm(),
        isActive: formIsActive,
      };
      const url = modal === "edit" && editingId ? `/api/app/lab-connectors/${editingId}` : "/api/app/lab-connectors";
      const method = modal === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }
      setMessage({ type: "success", text: modal === "edit" ? "Connector updated." : "Connector added." });
      closeModal();
      fetchConnectors();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/app/lab-connectors/${id}/test`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMessage({ type: "success", text: data.message ?? "Connection successful." });
      } else {
        setMessage({ type: "error", text: data.message ?? "Connection test failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Test request failed." });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete connector "${name}"? This cannot be undone.`)) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/app/lab-connectors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMessage({ type: "success", text: "Connector deleted." });
      fetchConnectors();
    } catch {
      setMessage({ type: "error", text: "Failed to delete connector." });
    }
  };

  const formatDate = (s: string | null) => (s ? new Date(s).toLocaleString() : "—");

  if (loading) {
    return (
      <div className="max-w-3xl">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Lab integration</span>
          <TestTubes className="w-7 h-7 text-teal-500" />
        </h1>
        <p className="text-slate-600 mt-1">
          Connect to Laboratory Information Systems (LIS) or Laboratory Information Management Systems (LIMS). Add connectors, configure provider and endpoint, and optionally import results.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success" ? "bg-teal-50 text-teal-800 border border-teal-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Connectors</h2>
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            Add connector
          </button>
        </div>

        {connectors.length === 0 ? (
          <p className="text-slate-500 py-6 text-center">No lab connectors yet. Add one to get started.</p>
        ) : (
          <ul className="space-y-3">
            {connectors.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    {c.type.toUpperCase()} · {PROVIDERS.find((p) => p.value === c.provider)?.label ?? c.provider}
                    {c.lastSyncAt && ` · Last sync: ${formatDate(c.lastSyncAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.isActive ? (
                    <span className="flex items-center gap-1 text-xs text-teal-600">
                      <CheckCircle className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <XCircle className="w-4 h-4" /> Inactive
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleTest(c.id)}
                    disabled={testingId === c.id}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
                  >
                    {testingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-200"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal !== "none" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {modal === "add" ? "Add lab connector" : "Edit lab connector"}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label htmlFor="connector-name" className={labelClass}>Name</label>
                <input
                  id="connector-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Main lab FHIR"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="connector-type" className={labelClass}>Type</label>
                  <select
                    id="connector-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "lis" | "lims")}
                    className={inputClass}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="connector-provider" className={labelClass}>Provider</label>
                  <select
                    id="connector-provider"
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    className={inputClass}
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(formProvider === "hl7_fhir" || formProvider === "custom_api") && (
                <>
                  <div>
                    <label htmlFor="config-endpoint" className={labelClass}>Endpoint URL</label>
                    <input
                      id="config-endpoint"
                      type="url"
                      value={formConfigEndpoint}
                      onChange={(e) => setFormConfigEndpoint(e.target.value)}
                      className={inputClass}
                      placeholder="https://fhir.example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="config-auth" className={labelClass}>Auth header (optional)</label>
                    <input
                      id="config-auth"
                      type="password"
                      value={formConfigAuthHeader}
                      onChange={(e) => setFormConfigAuthHeader(e.target.value)}
                      className={inputClass}
                      placeholder="Bearer … or leave blank"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label htmlFor="config-labid" className={labelClass}>Lab ID (optional)</label>
                    <input
                      id="config-labid"
                      type="text"
                      value={formConfigLabId}
                      onChange={(e) => setFormConfigLabId(e.target.value)}
                      className={inputClass}
                      placeholder="Lab identifier"
                    />
                  </div>
                </>
              )}
              {formProvider === "file_import" && (
                <p className="text-sm text-slate-500">Use the sync/import API to upload results. No endpoint needed.</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  id="connector-active"
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label htmlFor="connector-active" className="text-sm font-medium text-slate-700">Active</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
