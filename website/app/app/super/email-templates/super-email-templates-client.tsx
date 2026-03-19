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

const DEFAULT_STAFF_FORGOT_PASSWORD = {
  templateKey: "staff_forgot_password",
  name: "Staff/Admin — Forgot password",
  subject: "Reset your {{brandName}} password",
  html: `
<div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #f8fafc; padding: 28px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
    <div style="padding: 18px 20px; background: linear-gradient(135deg, #2563eb 0%, #14b8a6 100%); color: #fff;">
      <div style="font-weight: 800; font-size: 18px; letter-spacing: -0.01em;">{{brandName}}</div>
      <div style="opacity: 0.95; font-size: 13px; margin-top: 2px;">Password reset</div>
    </div>
    <div style="padding: 22px 20px; color: #0f172a;">
      <h1 style="margin: 0 0 10px; font-size: 20px; line-height: 1.2;">Reset your password</h1>
      <p style="margin: 0 0 14px; color: #334155; font-size: 14px; line-height: 1.6;">
        Hi {{name}}, click the button below to set a new password for your {{brandName}} account. This link expires in 1 hour.
      </p>
      <p style="margin: 18px 0;">
        <a href="{{resetUrl}}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 16px; border-radius: 12px;">
          Set new password
        </a>
      </p>
      <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.6;">
        Or copy and paste this link:<br />
        <span style="color: #2563eb;">{{resetUrl}}</span>
      </p>
    </div>
    <div style="padding: 14px 20px; background: #f1f5f9; color: #475569; font-size: 12px; line-height: 1.6;">
      If you didn’t request this, you can ignore this email.
      <div style="margin-top: 8px; font-weight: 700; color: #0f172a;">TheFertilityOS</div>
    </div>
  </div>
</div>
  `.trim(),
  text:
    "Hi {{name}},\n\nReset your {{brandName}} password using this link:\n{{resetUrl}}\n\nThis link expires in 1 hour.\n\n— TheFertilityOS",
};

export default function SuperEmailTemplatesClient() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("staff_forgot_password");
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
      const res = await fetch("/api/app/super/email-templates");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load templates");
      const rows: Template[] = data.templates ?? [];
      setTemplates(rows);

      // Seed default template if missing.
      if (!rows.some((t) => t.templateKey === "staff_forgot_password")) {
        await fetch("/api/app/super/email-templates", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(DEFAULT_STAFF_FORGOT_PASSWORD),
        });
        const again = await fetch("/api/app/super/email-templates");
        const againData = await again.json().catch(() => ({}));
        setTemplates(againData.templates ?? []);
      }
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
    if (!selected) return;
    setSubject(selected.subject);
    setHtml(selected.html);
    setText(selected.text ?? "");
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/app/super/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selected.templateKey,
          name: selected.name,
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
    if (!selected) return;
    if (!testTo.trim()) {
      setError("Enter a test recipient email.");
      return;
    }
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/app/super/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: selected.templateKey,
          to: testTo.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send test email");
      setMessage("Test email sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="text-slate-600">Loading templates…</div>;
  if (error) return <div className="text-red-700">{error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="text-sm font-bold text-slate-900 mb-3">Templates</div>
        <select
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
        >
          <option value="staff_forgot_password">Staff/Admin — Forgot password</option>
        </select>
        <div className="mt-4 text-xs text-slate-500">
          Placeholders: <code>{"{{name}}"}</code>, <code>{"{{resetUrl}}"}</code>,{" "}
          <code>{"{{brandName}}"}</code>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
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
      </div>

      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        {message && (
          <div className="mb-3 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
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

