import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiActivity,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiTrash2,
  FiUserPlus,
  FiAlertCircle,
  FiFilter,
} from "react-icons/fi";

const PAGE_SIZE = 20;

const ACTION_META = {
  change_role: {
    label: "Changed Role",
    color: "bg-blue-100 text-blue-600",
    icon: <FiEdit3 size={12} />,
  },
  delete_user: {
    label: "Deleted User",
    color: "bg-rose-100 text-rose-600",
    icon: <FiTrash2 size={12} />,
  },
  delete_course: {
    label: "Deleted Course",
    color: "bg-rose-100 text-rose-600",
    icon: <FiTrash2 size={12} />,
  },
  enroll_student: {
    label: "Enrolled Student",
    color: "bg-emerald-100 text-emerald-600",
    icon: <FiUserPlus size={12} />,
  },
  remove_enrollment: {
    label: "Removed Enrollment",
    color: "bg-orange-100 text-orange-600",
    icon: <FiAlertCircle size={12} />,
  },
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = () => {
    setLoading(true);
    api
      .get(`/admin/logs?skip=${(page - 1) * PAGE_SIZE}&limit=${PAGE_SIZE}`)
      .then((r) => {
        setLogs(r.data.logs);
        setTotal(r.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);
  useEffect(() => {
    setPage(1);
  }, [actionFilter]);

  const filtered =
    actionFilter === "all"
      ? logs
      : logs.filter((l) => l.action === actionFilter);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fmt = (ts) =>
    ts
      ? new Date(ts).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "—";

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiActivity className="bg-white/10 p-1.5 rounded-lg" size={36} />
              Activity Log
            </h1>
            <p className="text-slate-300 opacity-90">
              Audit trail of all admin actions in the system
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <FiFilter size={14} className="text-gray-400" />
                <button
                  onClick={() => setActionFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${actionFilter === "all" ? "bg-slate-700 text-white border-slate-700" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                >
                  All Actions
                </button>
                {Object.entries(ACTION_META).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setActionFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${actionFilter === key ? "bg-slate-700 text-white border-slate-700" : "bg-gray-50 text-gray-500 border-gray-200"}`}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 font-medium">
                  {total} actions
                </span>
                <button
                  onClick={fetchLogs}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition"
                >
                  <FiRefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">
                Loading…
              </div>
            ) : (
              <>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-4 pl-4 w-12">#</th>
                        <th className="pb-4 w-44">Action</th>
                        <th className="pb-4">Detail</th>
                        <th className="pb-4 text-center w-32">Admin</th>
                        <th className="pb-4 text-right pr-4 w-44">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((l, i) => {
                        const meta = ACTION_META[l.action] || {
                          label: l.action,
                          color: "bg-gray-100 text-gray-500",
                          icon: <FiAlertCircle size={12} />,
                        };
                        return (
                          <tr
                            key={l.id}
                            className="border-b border-gray-50 hover:bg-gray-50 transition h-14"
                          >
                            <td className="pl-4 text-gray-400 text-xs">
                              {(page - 1) * PAGE_SIZE + i + 1}
                            </td>
                            <td>
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${meta.color}`}
                              >
                                {meta.icon} {meta.label}
                              </span>
                            </td>
                            <td className="text-gray-600 text-xs max-w-[340px]">
                              <p className="truncate">{l.detail || "—"}</p>
                            </td>
                            <td className="text-center text-xs text-gray-500 font-semibold">
                              {l.admin_email?.split("@")[0] || "—"}
                            </td>
                            <td className="text-right pr-4 font-mono text-xs text-gray-400">
                              {fmt(l.timestamp)}
                            </td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-12 text-gray-400 text-sm"
                          >
                            {total === 0
                              ? "No admin actions recorded yet"
                              : "No actions match the selected filter"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                    <span className="text-sm text-gray-400">
                      Page {page} of {totalPages} · {total} total
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="w-9 h-9 flex items-center justify-center border rounded-lg hover:bg-gray-50 disabled:opacity-40"
                      >
                        <FiChevronLeft />
                      </button>
                      {Array.from(
                        { length: Math.min(totalPages, 7) },
                        (_, i) => i + 1,
                      ).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition ${p === page ? "bg-slate-700 text-white" : "border text-gray-500 hover:bg-gray-50"}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="w-9 h-9 flex items-center justify-center border rounded-lg hover:bg-gray-50 disabled:opacity-40"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
