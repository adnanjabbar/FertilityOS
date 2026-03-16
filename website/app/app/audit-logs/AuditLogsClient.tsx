"use client";

import { useEffect, useState } from "react";

type AuditLogEntry = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
};

type AuditLogResponse = {
  items: AuditLogEntry[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function parseDetails(details: string | null): Record<string, unknown> | string | null {
  if (details == null || details === "") return null;
  try {
    return JSON.parse(details) as Record<string, unknown>;
  } catch {
    return details;
  }
}

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPrefix, setActionPrefix] = useState("");
  const [entityType, setEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState("50");
  const [userQuery, setUserQuery] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionPrefix) params.set("actionPrefix", actionPrefix);
      if (entityType) params.set("entityType", entityType);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (userQuery) params.set("user", userQuery);
      if (search) params.set("search", search);
      params.set("page", String(page));
      if (pageSize) params.set("pageSize", pageSize);
      const res = await fetch(`/api/app/audit-logs?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to load audit logs");
        setLogs([]);
        return;
      }
      const data: AuditLogResponse = await res.json();
      setLogs(data.items);
      setHasMore(data.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const detailsStr = (details: string | null) => {
    const parsed = parseDetails(details);
    if (parsed == null) return "—";
    if (typeof parsed === "string") return parsed;
    return JSON.stringify(parsed);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Action prefix</span>
          <input
            type="text"
            placeholder="e.g. auth. or patient."
            value={actionPrefix}
            onChange={(e) => setActionPrefix(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Entity type</span>
          <input
            type="text"
            placeholder="e.g. patient"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">User</span>
          <input
            type="text"
            placeholder="Name or email"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Quick search</span>
          <input
            type="text"
            placeholder="Entity ID or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">From date</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">To date</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setPage(1);
            void fetchLogs();
          }}
          className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800"
        >
          Apply
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Entity</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Details</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formatTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-slate-900">
                      {log.userName ?? log.userEmail ?? "—"}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{log.action}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.entityType}
                      {log.entityId && (
                        <span className="text-slate-400 ml-1 font-mono text-xs">
                          {log.entityId.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={detailsStr(log.details)}>
                      {detailsStr(log.details)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {log.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          Page <span className="font-medium">{page}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => {
              if (hasMore && !loading) {
                setPage((p) => p + 1);
              }
            }}
            disabled={!hasMore || loading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
