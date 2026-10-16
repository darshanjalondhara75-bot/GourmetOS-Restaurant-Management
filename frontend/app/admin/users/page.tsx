"use client";

import React, { useEffect, useState } from "react";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/authContext";
import {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
  RestaurantUser,
} from "@/lib/api";
import {
  Users,
  Plus,
  Trash2,
  X,
  ShieldCheck,
  ChevronDown,
  UserCircle2,
  AlertCircle,
  CheckCircle2,
  Mail,
  ChefHat,
  WalletCards,
  Shield,
} from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { AppShell } from "@/components/AppShell";
import { PageWrapper } from "@/components/PageWrapper";

const ROLE_BADGE: Record<string, string> = {
  admin:   "badge-purple",
  cashier: "badge-emerald",
  chef:    "badge-amber",
  user:    "badge-indigo",
};
const ROLE_EMOJI: Record<string, string> = {
  admin:   "🛡️",
  cashier: "💳",
  chef:    "👨‍🍳",
  user:    "👤",
};
const ROLE_AVATAR_CONFIG: Record<string, { icon: any, color: string }> = {
  admin:   { icon: ShieldCheck, color: "bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800" },
  cashier: { icon: WalletCards, color: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800" },
  chef:    { icon: ChefHat,    color: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800" },
  user:    { icon: UserCircle2, color: "bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800" },
};

function RoleAvatar({ role, size = "md" }: { role: string, size?: "sm" | "md" | "lg" }) {
  const config = ROLE_AVATAR_CONFIG[role] || ROLE_AVATAR_CONFIG.admin;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-xl ring-1 transition-all ${sizeClasses[size]} ${config.color}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

export default function UserManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const [users,        setUsers]        = useState<RestaurantUser[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [successMsg,   setSuccessMsg]   = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  // Form
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState<"user" | "cashier" | "chef">("user");

  useEffect(() => { if (!authLoading && user) loadUsers(); }, [user, authLoading]);

  // Auto-clear alerts
  useEffect(() => {
    if (!error && !successMsg) return;
    const t = setTimeout(() => { setError(null); setSuccessMsg(null); }, 5000);
    return () => clearTimeout(t);
  }, [error, successMsg]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getUsers();
      setUsers(allUsers.filter(u => u.role !== "user"));
    }
    catch (e: any) { setError(e.message || "Failed to load users."); }
    finally { setLoading(false); }
  };

  useRealtimeUpdates(loadUsers, ["users"]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createUser({ name, email, password, role });
      setSuccessMsg(`${name} added as ${role}.`);
      setShowModal(false);
      setName(""); setEmail(""); setPassword(""); setRole("user");
      loadUsers();
    } catch (e: any) { setError(e.message || "Failed to create user."); }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try   { await updateUserRole(userId, newRole); loadUsers(); }
    catch (e: any) { setError(e.message || "Failed to update role."); }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Delete "${userName}" permanently?`)) return;
    setDeletingId(userId);
    try   { await deleteUser(userId); setSuccessMsg("User deleted."); loadUsers(); }
    catch (e: any) { setError(e.message || "Failed to delete user."); }
    finally { setDeletingId(null); }
  };

  return (
    <PageWrapper>
      <div className="page-with-fixed-nav min-h-screen bg-[#f7f8fc] dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 w-full max-w-7xl mx-auto space-y-6">

          {/* ── Page Header ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6
                          flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-purple">Module 5</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">• Access Control</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                User Management Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Manage customer and staff accounts with role assignments.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-xs font-bold py-2.5 px-4 w-full sm:w-auto justify-center flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Staff Member
            </button>
          </div>

          {/* ── Alerts ── */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-sm font-medium">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="shrink-0 text-rose-400 hover:text-rose-600 dark:text-rose-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1">{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="shrink-0 text-emerald-400 hover:text-emerald-600 dark:text-emerald-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              Loading staff accounts…
            </div>
          )}

          {/* ── Empty State ── */}
          {!loading && users.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center transition-colors">
              <UserCircle2 className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="font-semibold text-slate-500 dark:text-slate-400">No staff accounts yet.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tap "Add Staff Member" to create the first account.</p>
            </div>
          )}

          {!loading && users.length > 0 && (<>

            {/* ═══════════════════════════════════════════
                MOBILE & TABLET CARDS  —  shown below lg breakpoint
            ═══════════════════════════════════════════ */}
              <div className="flex flex-col gap-4 lg:hidden">
              {users.map((u) => (
                <div key={u.id}
                  className="light-card group transition-all duration-200 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">

                  {/* Identity Section */}
                  <div className="p-4 flex items-center gap-4">
                    <RoleAvatar role={u.role} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
                          {u.name}
                        </p>
                        <span className={`badge ${ROLE_BADGE[u.role]} shrink-0`}>
                          {u.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        <p className="text-xs truncate">{u.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Management Section */}
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 p-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 shrink-0">
                        Account Role
                      </span>
                      <div className="relative group flex-1 min-w-0 flex items-center">
                        {u.role === "admin" ? (
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md ring-1 ring-purple-200 dark:ring-purple-800">
                            Protected Admin
                          </span>
                        ) : (
                          <CustomSelect
                            value={u.role}
                            options={[
                              { label: "💳 Cashier", value: "cashier" },
                              { label: "👨‍🍳 Chef", value: "chef" },
                            ]}
                            onChange={(val) => handleRoleChange(u.id, val)}
                            className="w-full sm:w-32 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                          />
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      disabled={deletingId === u.id}
                      className="p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-sm group-hover:border-slate-100 dark:group-hover:border-slate-700 border border-transparent disabled:opacity-40 shrink-0 self-end sm:self-center flex items-center justify-center"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ═══════════════════════════════════════════
                DESKTOP TABLE  —  shown from lg up
            ═══════════════════════════════════════════ */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors">
              <div className="w-full overflow-hidden">
                <table className="w-full table-fixed text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-xs">
                      <th className="pb-3 w-[24%]">Staff Name</th>
                      <th className="pb-3 w-[32%]">Email Address</th>
                      <th className="pb-3 w-[16%]">Current Role</th>
                      <th className="pb-3 w-[18%]">Change Role</th>
                      <th className="pb-3 w-[10%] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <RoleAvatar role={u.role} size="md" />
                            <span className="font-bold text-slate-900 dark:text-slate-100">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            {u.email}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`badge ${ROLE_BADGE[u.role]}`}>
                            {ROLE_EMOJI[u.role]} {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4">
                          {u.role === "admin" ? (
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Protected Admin</span>
                          ) : (
                            <CustomSelect
                              value={u.role}
                              options={[
                                { label: "💳 Cashier", value: "cashier" },
                                { label: "👨‍🍳 Chef", value: "chef" },
                              ]}
                              onChange={(val) => handleRoleChange(u.id, val)}
                              className="w-32 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                            />
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            disabled={deletingId === u.id}
                            className="w-8 h-8 mx-auto rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition disabled:opacity-40 flex items-center justify-center"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>)}
        </main>
      </div>
      {/* ═══════════════════════════════════════════
          ADD USER MODAL
          Mobile  → slides up from bottom (sheet)
          Desktop → centred dialog
      ═══════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                     bg-slate-900/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900
                          rounded-t-3xl sm:rounded-2xl
                          shadow-2xl border border-slate-200 dark:border-slate-800
                          p-5 sm:p-6 sm:mx-4 transition-colors">
            {/* Drag handle (mobile only) */}
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Staff Account</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fill in the details to create a new account.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 -mt-1 -mr-1 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  placeholder="e.g. Gordon Ramsay"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  placeholder="e.g. chef@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {/* Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Assigned Role
                </label>
                <CustomSelect
                  value={role}
                  options={[
                    { label: "💳 Cashier", value: "cashier" },
                    { label: "👨‍🍳 Chef", value: "chef" },
                  ]}
                  onChange={(val) => setRole(val as "user" | "cashier" | "chef")}
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs w-full sm:w-auto justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" /> Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </PageWrapper>
  );
}
