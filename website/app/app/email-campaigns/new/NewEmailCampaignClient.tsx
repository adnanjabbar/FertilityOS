"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlatformEmailFooter from "@/app/components/PlatformEmailFooter";

export default function NewEmailCampaignClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const saveDraft = async () => {
    setMessage(null);
    if (!name.trim() || !subject.trim() || !bodyHtml.trim() || !bodyText.trim()) {
      setMessage({ type: "error", text: "Name, subject, and body (HTML and text) are required." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/app/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          bodyHtml: bodyHtml.trim(),
          bodyText: bodyText.trim(),
          recipientFilter: recipientFilter,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create");
      }
      const data = await res.json();
      setMessage({ type: "success", text: "Draft saved." });
      router.push(`/app/email-campaigns/${data.id}`);
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to save draft",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendNow = async () => {
    setMessage(null);
    if (!name.trim() || !subject.trim() || !bodyHtml.trim() || !bodyText.trim()) {
      setMessage({ type: "error", text: "Name, subject, and body are required before sending." });
      return;
    }
    setSending(true);
    try {
      const createRes = await fetch("/api/app/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          bodyHtml: bodyHtml.trim(),
          bodyText: bodyText.trim(),
          recipientFilter: recipientFilter,
        }),
      });
      if (!createRes.ok) {
        const d = await createRes.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to create campaign");
      }
      const created = await createRes.json();
      const sendRes = await fetch(`/api/app/email-campaigns/${created.id}/send`, {
        method: "POST",
      });
      if (!sendRes.ok) {
        const d = await sendRes.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to send");
      }
      const result = await sendRes.json();
      setMessage({
        type: "success",
        text: `Sent to ${result.sent} recipient(s).${result.failed ? ` ${result.failed} failed.` : ""}`,
      });
      router.push("/app/email-campaigns");
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to send",
      });
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/app/email-campaigns"
          className="text-slate-600 hover:text-slate-900 text-sm font-medium"
        >
          ← Back to campaigns
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">New email campaign</h1>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-teal-50 text-teal-800 border border-teal-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <label htmlFor="name" className={labelClass}>
            Campaign name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. March newsletter"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="subject" className={labelClass}>
            Subject line
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="recipientFilter" className={labelClass}>
            Recipients
          </label>
          <select
            id="recipientFilter"
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">All patients with email</option>
          </select>
        </div>
        <div>
          <label htmlFor="bodyHtml" className={labelClass}>
            Body (HTML)
          </label>
          <textarea
            id="bodyHtml"
            rows={10}
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            placeholder="<p>Hello …</p>"
            className={inputClass + " font-mono text-sm"}
          />
        </div>
        <div>
          <label htmlFor="bodyText" className={labelClass}>
            Body (plain text fallback)
          </label>
          <textarea
            id="bodyText"
            rows={6}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Plain text version"
            className={inputClass}
          />
        </div>

        <PlatformEmailFooter className="mt-4" />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveDraft}
          disabled={saving || sending}
          className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-sm hover:bg-slate-200 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={sendNow}
          disabled={saving || sending}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-teal-700 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send now"}
        </button>
        <Link
          href="/app/email-campaigns"
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 inline-block"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
