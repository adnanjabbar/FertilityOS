"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlatformEmailFooter from "@/app/components/PlatformEmailFooter";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  status: "draft" | "scheduled" | "sent";
  scheduledAt: string | null;
  sentAt: string | null;
  recipientFilter: string;
  createdAt: string;
  updatedAt: string;
};

type Props = { campaignId: string };

export default function EmailCampaignDetailClient({ campaignId }: Props) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBodyHtml, setEditBodyHtml] = useState("");
  const [editBodyText, setEditBodyText] = useState("");
  const [editRecipientFilter, setEditRecipientFilter] = useState("all");

  useEffect(() => {
    fetch(`/api/app/email-campaigns/${campaignId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) {
          setCampaign(data);
          setEditName(data.name);
          setEditSubject(data.subject);
          setEditBodyHtml(data.bodyHtml);
          setEditBodyText(data.bodyText);
          setEditRecipientFilter(data.recipientFilter ?? "all");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [campaignId]);

  const saveDraft = async () => {
    if (!campaign || campaign.status !== "draft") return;
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/app/email-campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          subject: editSubject.trim(),
          bodyHtml: editBodyHtml.trim(),
          bodyText: editBodyText.trim(),
          recipientFilter: editRecipientFilter,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setCampaign(updated);
      setMessage({ type: "success", text: "Draft saved." });
    } catch {
      setMessage({ type: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail.trim())) {
      setMessage({ type: "error", text: "Enter a valid email address." });
      return;
    }
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/app/email-campaigns/${campaignId}/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to send test");
      }
      setMessage({ type: "success", text: "Test email sent." });
      setTestModalOpen(false);
      setTestEmail("");
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to send test",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendNow = async () => {
    if (!campaign || campaign.status === "sent") return;
    setMessage(null);
    setSending(true);
    try {
      const res = await fetch(`/api/app/email-campaigns/${campaignId}/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to send");
      }
      const result = await res.json();
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

  const deleteDraft = async () => {
    if (!campaign || campaign.status !== "draft") return;
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/app/email-campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/app/email-campaigns");
    } catch {
      setMessage({ type: "error", text: "Failed to delete." });
    }
  };

  const inputClass =
    "w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1";

  if (loading) {
    return <p className="text-slate-500">Loading…</p>;
  }
  if (!campaign) {
    return (
      <div>
        <p className="text-slate-600">Campaign not found.</p>
        <Link href="/app/email-campaigns" className="mt-2 inline-block text-blue-600 hover:underline">
          Back to campaigns
        </Link>
      </div>
    );
  }

  const isDraft = campaign.status === "draft";

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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            campaign.status === "sent"
              ? "bg-teal-100 text-teal-800"
              : campaign.status === "scheduled"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {campaign.status}
        </span>
      </div>

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
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={!isDraft}
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
            value={editSubject}
            onChange={(e) => setEditSubject(e.target.value)}
            disabled={!isDraft}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="recipientFilter" className={labelClass}>
            Recipients
          </label>
          <select
            id="recipientFilter"
            value={editRecipientFilter}
            onChange={(e) => setEditRecipientFilter(e.target.value)}
            disabled={!isDraft}
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
            value={editBodyHtml}
            onChange={(e) => setEditBodyHtml(e.target.value)}
            disabled={!isDraft}
            className={inputClass + " font-mono text-sm"}
          />
        </div>
        <div>
          <label htmlFor="bodyText" className={labelClass}>
            Body (plain text)
          </label>
          <textarea
            id="bodyText"
            rows={6}
            value={editBodyText}
            onChange={(e) => setEditBodyText(e.target.value)}
            disabled={!isDraft}
            className={inputClass}
          />
        </div>

        <PlatformEmailFooter className="mt-4" />
      </div>

      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <>
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
              onClick={() => setTestModalOpen(true)}
              disabled={saving || sending}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Send test
            </button>
            <button
              type="button"
              onClick={sendNow}
              disabled={saving || sending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-teal-700 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send now"}
            </button>
            <button
              type="button"
              onClick={deleteDraft}
              disabled={saving || sending}
              className="px-5 py-2.5 rounded-xl border border-red-200 text-red-700 font-semibold text-sm hover:bg-red-50 disabled:opacity-50"
            >
              Delete draft
            </button>
          </>
        )}
        <Link
          href="/app/email-campaigns"
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 inline-block"
        >
          Back to list
        </Link>
      </div>

      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Send test email</h2>
            <p className="text-sm text-slate-600 mb-4">A test email will include the platform footer (FertilityOS link).</p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass + " mb-4"}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={sendTest}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Sending…" : "Send"}
              </button>
              <button
                type="button"
                onClick={() => { setTestModalOpen(false); setTestEmail(""); }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
