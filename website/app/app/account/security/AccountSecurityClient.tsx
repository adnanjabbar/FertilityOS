"use client";

import { useEffect, useState } from "react";

type SessionRow = {
  id: string;
  sessionId: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  isCurrent: boolean;
};

export default function AccountSecurityClient() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<"current" | "others" | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/app/account/sessions");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to load sessions.");
        return;
      }
      setSessions(data.sessions ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const revokeCurrent = async () => {
    setRevoking("current");
    setError(null);
    try {
      const res = await fetch("/api/app/account/sessions/revoke-current", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to sign out from this device.");
        return;
      }
      await loadSessions();
    } finally {
      setRevoking(null);
    }
  };

  const revokeOthers = async () => {
    setRevoking("others");
    setError(null);
    try {
      const res = await fetch("/api/app/account/sessions/revoke-others", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to sign out from other devices.");
        return;
      }
      await loadSessions();
    } finally {
      setRevoking(null);
    }
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  if (loading) {
    return <div className="text-slate-600">Loading security settings…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Account security</h1>
        <p className="text-sm text-slate-500">
          Review where your account is signed in and sign out from devices you no longer use.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Active sessions</h2>
            <p className="text-xs text-slate-500">
              Your recent sign-ins by browser and device. The current session is highlighted.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={revokeOthers}
              disabled={revoking === "others" || sessions.length <= 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
            >
              {revoking === "others" ? "Signing out…" : "Sign out from other devices"}
            </button>
            <button
              type="button"
              onClick={revokeCurrent}
              disabled={revoking === "current"}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
            >
              {revoking === "current" ? "Signing out…" : "Sign out from this device"}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No active sessions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">Device</th>
                  <th className="py-2 pr-4 font-medium">IP address</th>
                  <th className="py-2 pr-4 font-medium">Signed in</th>
                  <th className="py-2 pr-4 font-medium">Last active</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-slate-100 last:border-0 ${
                      s.isCurrent ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 align-top">
                      <div className="flex flex-col">
                        <span className="text-slate-900">
                          {s.userAgent || "Unknown device"}
                        </span>
                        {s.isCurrent && (
                          <span className="text-xs text-blue-700 font-semibold">
                            Current session
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4 align-top text-slate-700">
                      {s.ipAddress || "—"}
                    </td>
                    <td className="py-2 pr-4 align-top text-slate-700">
                      {formatDateTime(s.createdAt)}
                    </td>
                    <td className="py-2 pr-4 align-top text-slate-700">
                      {formatDateTime(s.lastUsedAt)}
                    </td>
                    <td className="py-2 pr-4 align-top">
                      {s.revokedAt ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          Signed out
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

