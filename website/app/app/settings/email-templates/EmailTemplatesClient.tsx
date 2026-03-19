"use client";

import { useEffect, useMemo, useState } from "react";

type Template = {
  id: string;
  templateKey: string;
  name: string;
  subject: string;
  html: string;
  text: string | null;
  updatedAt: string;
};

const DEFAULTS: Record<string, Omit<Template, "id" | "updatedAt">> = {
  patient_magic_link: {
    templateKey: "patient_magic_link",
    name: "Patient portal — Magic link",
    subject: "Sign in to your patient portal",
    html: `<p>Hi {{patientName}},</p>
<p>Click below to sign in:</p>
<p><a href="{{magicLinkUrl}}" style="color:#2563eb;">Sign in</a></p>
<p style="color:#64748b;font-size:14px;">This link expires in 24 hours.</p>`,
    text: "Hi {{patientName}},\n\nSign in:\n{{magicLinkUrl}}\n\nThis link expires in 24 hours.",
  },
  patient_reset_password: {
    templateKey: "patient_reset_password",
    name: "Patient portal — Reset password",
    subject: "Reset your patient portal password",
    html: `<p>Hi {{patientName}},</p>
<p>Click below to reset your password:</p>
<p><a href="{{resetUrl}}" style="color:#2563eb;">Reset password</a></p>
<p style="color:#64748b;font-size:14px;">This link expires in 1 hour.</p>`,
    text: "Hi {{patientName}},\n\nReset password:\n{{resetUrl}}\n\nThis link expires in 1 hour.",
  },
  patient_set_password: {
    templateKey: "patient_set_password",
    name: "Patient portal — Set password",
    subject: "Set your patient portal password",
    html: `<p>Hi {{patientName}},</p>
<p>Click below to set your password:</p>
<p><a href="{{setPasswordUrl}}" style="color:#2563eb;">Set password</a></p>
<p style="color:#64748b;font-size:14px;">This link expires in 24 hours.</p>`,
    text: "Hi {{patientName}},\n\nSet password:\n{{setPasswordUrl}}\n\nThis link expires in 24 hours.",
  },
  appointment_reminder: {
    templateKey: "appointment_reminder",
    name: "Appointments — Reminder",
    subject: "Appointment reminder: {{appointmentType}} on {{appointmentDate}}",
    html: `<p>Hi {{patientName}},</p>
<p>This is a reminder that you have an appointment <strong>{{appointmentType}}</strong> on <strong>{{appointmentDate}}</strong>.</p>
<p>{{clinicName}}</p>`,
    text: "Hi {{patientName}},\n\nAppointment {{appointmentType}} on {{appointmentDate}}.\n\n{{clinicName}}",
  },
};

export default function EmailTemplatesClient() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("patient_magic_link");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => templates.find((t) => t.templateKey === selectedKey) ?? null,
    [templates, selectedKey]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/app/settings/email-templates");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load templates");
      setTemplates(data.templates ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const row = selected ?? null;
    if (row) {
      setSubject(row.subject);
      setHtml(row.html);
      setText(row.text ?? "");
      return;
    }
    const def = DEFAULTS[selectedKey];
    if (def) {
      setSubject(def.subject);
      setHtml(def.html);
      setText(def.text ?? "");
    }
  }, [selectedKey, selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const def = DEFAULTS[selectedKey];
      const res = await fetch("/api/app/settings/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selectedKey,
          name: selected?.name ?? def?.name ?? selectedKey,
          subject,
          html,
          text,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMessage("Saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!testTo.trim()) {
      setError("Enter a test recipient email.");
      return;
    }
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/app/settings/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: selectedKey, to: testTo.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send test");
      setMessage("Test email sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send test");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="text-slate-600">Loading…</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Email templates</h1>
          <p className="text-slate-600 text-sm mt-1">
            Customize patient-facing emails. The “Powered by TheFertilityOS” footer is controlled by your white-label setting.
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <div className="text-sm font-bold text-slate-900 mb-2">Template</div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
            >
              <option value="patient_magic_link">Patient portal — Magic link</option>
              <option value="patient_reset_password">Patient portal — Reset password</option>
              <option value="patient_set_password">Patient portal — Set password</option>
              <option value="appointment_reminder">Appointment reminder</option>
            </select>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="text-sm font-bold text-slate-900 mb-2">Send test</div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="to@example.com"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
            <button
              onClick={sendTest}
              disabled={testing}
              className="mt-3 w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm disabled:opacity-60"
            >
              {testing ? "Sending…" : "Send test email"}
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Variables include: <code>{"{{patientName}}"}</code>, <code>{"{{clinicName}}"}</code>,{" "}
            <code>{"{{magicLinkUrl}}"}</code>, <code>{"{{resetUrl}}"}</code>,{" "}
            <code>{"{{setPasswordUrl}}"}</code>, <code>{"{{appointmentType}}"}</code>,{" "}
            <code>{"{{appointmentDate}}"}</code>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-1">Subject</div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-1">HTML</div>
            <textarea
              className="w-full min-h-[260px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-1">Text (optional)</div>
            <textarea
              className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full px-4 py-3 rounded-xl bg-blue-700 text-white font-bold disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save template"}
          </button>
        </div>
      </div>
    </div>
  );
}

