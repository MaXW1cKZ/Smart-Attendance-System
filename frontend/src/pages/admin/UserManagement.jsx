import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiUsers,
  FiSearch,
  FiEdit3,
  FiTrash2,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiRefreshCw,
} from "react-icons/fi";

const PAGE_SIZE = 15;
const ROLES = ["all", "student", "teacher", "admin"];

const ROLE_STYLE = {
  student: "bg-blue-100 text-blue-600",
  teacher: "bg-emerald-100 text-emerald-600",
  admin: "bg-rose-100 text-rose-600",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [editUser, setEditUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteUser, setDeleteUser] = useState(null);
  const [confirmInput, setConfirmInput] = useState("");

  const myId = parseInt(localStorage.getItem("user_id"));

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    });
    if (search) params.append("search", search);
    if (roleFilter !== "all") params.append("role", roleFilter);

    api
      .get(`/admin/users?${params}`)
      .then((r) => {
        setUsers(r.data.users);
        setTotal(r.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const handleChangeRole = async () => {
    if (!newRole || newRole === editUser.role) return;
    setSaving(true);
    try {
      await api.patch(`/admin/users/${editUser.id}/role`, { role: newRole });
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to change role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await api.delete(`/admin/users/${deleteUser.id}`);
      setDeleteUser(null);
      setConfirmInput("");
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiUsers className="bg-white/10 p-1.5 rounded-lg" size={36} />
              User Management
            </h1>
            <p className="text-slate-300 opacity-90">
              View all users · Change roles · Remove accounts
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col">
            <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <FiSearch
                    className="absolute left-3 top-3 text-gray-400"
                    size={14}
                  />
                  <input
                    placeholder="Search name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium w-60 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="flex gap-1.5">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize transition ${
                        roleFilter === r
                          ? "bg-slate-700 text-white border-slate-700"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {r === "all" ? "All" : r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 font-medium">
                  {total} users
                </span>
                <button
                  onClick={fetchUsers}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition"
                >
                  <FiRefreshCw size={14} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">
                Loading...
              </div>
            ) : (
              <>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-4 pl-4">#</th>
                        <th className="pb-4">Name / Email</th>
                        <th className="pb-4 text-center">Role</th>
                        <th className="pb-4 text-center">Joined</th>
                        <th className="pb-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr
                          key={u.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition h-16"
                        >
                          <td className="pl-4 text-gray-400 text-xs">
                            {(page - 1) * PAGE_SIZE + i + 1}
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${ROLE_STYLE[u.role] || "bg-gray-100 text-gray-500"}`}
                              >
                                {(u.full_name || u.email)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">
                                  {u.full_name || "—"}
                                  {u.id === myId && (
                                    <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-semibold">
                                      you
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${ROLE_STYLE[u.role] || "bg-gray-100 text-gray-500"}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="text-center text-xs text-gray-400 font-mono">
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </td>
                          <td className="text-center">
                            {u.id !== myId ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditUser(u);
                                    setNewRole(u.role);
                                  }}
                                  className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                  title="Change role"
                                >
                                  <FiEdit3 size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteUser(u);
                                    setConfirmInput("");
                                  }}
                                  className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
                                  title="Delete user"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-12 text-gray-400 text-sm"
                          >
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                    <span className="text-sm text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="w-9 h-9 flex items-center justify-center border rounded-lg hover:bg-gray-50 disabled:opacity-40 text-sm"
                      >
                        ←
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
                        className="w-9 h-9 flex items-center justify-center border rounded-lg hover:bg-gray-50 disabled:opacity-40 text-sm"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {editUser && (
        <Modal onClose={() => setEditUser(null)}>
          <h3 className="text-xl font-bold text-gray-800 mb-1">Change Role</h3>
          <p className="text-sm text-gray-400 mb-6">{editUser.email}</p>
          <div className="flex gap-3 mb-4">
            {["student", "teacher", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => setNewRole(r)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm capitalize border-2 transition ${
                  newRole === r
                    ? r === "admin"
                      ? "border-rose-500 bg-rose-50 text-rose-600"
                      : r === "teacher"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                        : "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {newRole === "admin" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-semibold mb-4 flex items-center gap-2">
              <FiAlertCircle size={14} /> This grants full system access. Use
              with caution.
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setEditUser(null)}
              className="flex-1 py-3 rounded-xl border font-bold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleChangeRole}
              disabled={saving || newRole === editUser.role}
              className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <FiCheck size={15} /> Confirm
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {deleteUser && (
        <Modal onClose={() => setDeleteUser(null)}>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiAlertCircle size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Delete User?</h3>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-bold text-gray-700">
                {deleteUser.full_name}
              </span>
              <br />
              {deleteUser.email}
            </p>
            <p className="text-xs text-rose-500 font-semibold mt-2">
              This permanently deletes the account and all associated data.
            </p>
          </div>
          <input
            placeholder={`Type "${deleteUser.email}" to confirm`}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            className="w-full mb-4 px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-rose-400 outline-none text-sm font-medium"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteUser(null)}
              className="flex-1 py-3 rounded-xl border font-bold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmInput !== deleteUser.email}
              className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 disabled:opacity-40 transition"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl hover:bg-gray-100 text-gray-400"
        >
          <FiX size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
