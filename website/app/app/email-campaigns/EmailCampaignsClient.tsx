"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sent";
  scheduledAt: string | null;
  sentAt: string | null;
  recipientFilter: string;
  createdAt: string;
  updatedAt: string;
};

export default function EmailCampaignsClient() {
  const router = useRouter();
  const [list, setList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app/email-campaigns")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusBadge = (status: string) => {
    const classes =
      status === "sent"
        ? "bg-teal-100 text-teal-800"
        : status === "scheduled"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700";
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
        {status}
      </span>
    );
  };

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email campaigns</h1>
          <p className="text-slate-600 mt-1">
            Send newsletters and automated emails to patients. Default emails include FertilityOS branding; use custom domain in Settings for your own.
          </p>
        </div>
        <Link
          href="/app/email-campaigns/new"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700"
        >
          Create draft
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">No campaigns yet. Create a draft to get started.</p>
          <Link
            href="/app/email-campaigns/new"
            className="mt-4 inline-block text-blue-600 font-medium hover:underline"
          >
            Create draft
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sent / Scheduled</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.subject}</td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {c.status === "sent" ? formatDate(c.sentAt) : formatDate(c.scheduledAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => router.push(`/app/email-campaigns/${c.id}`)}
                      className="text-blue-600 font-medium hover:underline text-sm"
                    >
                      {c.status === "draft" ? "Edit" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
