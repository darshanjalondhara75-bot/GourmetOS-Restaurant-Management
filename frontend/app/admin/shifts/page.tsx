"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/authContext";
import {
  getShifts,
  createShift,
  updateShiftDetails,
  updateShiftStatus,
  deleteShift,
  getUsers,
  StaffShift,
  RestaurantUser
} from "@/lib/api";
import { PageWrapper } from "@/components/PageWrapper";
import { Clock, Plus, Trash2, UserCheck, Edit, X } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";

export default function ShiftManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [staffUsers, setStaffUsers] = useState<RestaurantUser[]>([]);

  // Create Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [shiftName, setShiftName] = useState("");
  const [startTime, setStartTime] = useState("08:00 AM");
  const [endTime, setEndTime] = useState("04:00 PM");
  const [assignedUser, setAssignedUser] = useState("");

  // Edit Modal State
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
  const [editShiftName, setEditShiftName] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editAssignedUser, setEditAssignedUser] = useState("");
  const [editStatus, setEditStatus] = useState("Active");

  useEffect(() => {
    if (authLoading || !user) return;
    loadShifts();
    loadStaff();
  }, [user, authLoading]);

  const loadShifts = async () => {
    try {
      const data = await getShifts();
      setShifts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStaff = async () => {
    try {
      const users = await getUsers();
      setStaffUsers(users);
    } catch (err) {
      console.error(err);
    }
  };

  useRealtimeUpdates(() => {
    void loadShifts();
    void loadStaff();
  }, ["shifts", "users"]);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createShift({
        shift_name: shiftName,
        start_time: startTime,
        end_time: endTime,
        assigned_user: assignedUser || "Unassigned Staff",
        status: "Active"
      });
      setShowAddModal(false);
      setShiftName("");
      loadShifts();
    } catch (err: any) {
      alert(err.message || "Failed to create shift");
    }
  };

  const openEditModal = (shift: StaffShift) => {
    setEditingShift(shift);
    setEditShiftName(shift.shift_name);
    setEditStartTime(shift.start_time);
    setEditEndTime(shift.end_time);
    setEditAssignedUser(shift.assigned_user);
    setEditStatus(shift.status);
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    try {
      await updateShiftDetails(editingShift.id, {
        shift_name: editShiftName,
        start_time: editStartTime,
        end_time: editEndTime,
        assigned_user: editAssignedUser,
        status: editStatus
      });
      setEditingShift(null);
      loadShifts();
    } catch (err: any) {
      alert(err.message || "Failed to update shift");
    }
  };

  const handleStatusToggle = async (shiftId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Closed" : "Active";
    try {
      await updateShiftStatus(shiftId, nextStatus);
      loadShifts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm("Delete this shift schedule?")) return;
    try {
      await deleteShift(shiftId);
      loadShifts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-[#f7f8fc] dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 sm:space-y-6 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-purple">Module 7</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">• Staff Schedules</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Shift Management
              </h1>
              <p className="max-w-3xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 break-words">
                Create shifts, configure working hours, assign cashiers and chefs, and monitor active shifts.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs font-bold py-2.5 px-4 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Create Shift
            </button>
          </div>

          {/* Shifts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
            {shifts.map((s) => (
              <div key={s.id} className="light-card min-w-0 p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="min-w-0 truncate font-bold text-base text-slate-900 dark:text-slate-100">{s.shift_name}</h3>
                    <span className={`badge ${s.status === "Active" ? "badge-emerald" : "badge-rose"}`}>
                      {s.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">
                    <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span>{s.start_time} — {s.end_time}</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Assigned Staff</p>
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">{s.assigned_user}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <button
                      onClick={() => openEditModal(s)}
                      className="btn-secondary text-xs flex min-h-9 flex-1 items-center justify-center gap-1.5 py-1.5 px-3 sm:flex-none"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> Edit Shift
                    </button>
                    <button
                      onClick={() => handleStatusToggle(s.id, s.status)}
                      className="btn-secondary text-xs flex min-h-9 flex-1 items-center justify-center py-1.5 px-3 sm:flex-none"
                    >
                      Set to {s.status === "Active" ? "Closed" : "Active"}
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteShift(s.id)}
                    className="h-9 w-9 shrink-0 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition flex items-center justify-center"
                    title="Delete Shift"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create Shift Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create Staff Shift</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateShift} className="space-y-4">
                  <div className="input-group">
                    <label className="input-label text-slate-700 dark:text-slate-300">Shift Title</label>
                    <input
                      type="text"
                      className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                      placeholder="e.g. Morning Rush"
                      value={shiftName}
                      onChange={(e) => setShiftName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="input-group">
                      <label className="input-label text-slate-700 dark:text-slate-300">Start Time</label>
                      <input
                        type="text"
                        className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                        placeholder="08:00 AM"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label text-slate-700 dark:text-slate-300">End Time</label>
                      <input
                        type="text"
                        className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                        placeholder="04:00 PM"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label text-slate-700 dark:text-slate-300">Assign Staff Member</label>
                    <CustomSelect
                      value={assignedUser}
                      options={[
                        { value: "", label: "Select Staff..." },
                        ...staffUsers
                          .filter((u) => u.role === "cashier" || u.role === "chef")
                          .map((u) => ({
                            value: `${u.name} (${u.role})`,
                            label: `${u.name} — ${u.role.toUpperCase()}`,
                          })),
                      ]}
                      onChange={setAssignedUser}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary text-xs">
                      Save Shift Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Shift Modal */}
          {editingShift && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Edit Shift Schedule</h3>
                  <button onClick={() => setEditingShift(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdateShift} className="space-y-4">
                  <div className="input-group">
                    <label className="input-label text-slate-700 dark:text-slate-300">Shift Title</label>
                    <input
                      type="text"
                      className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                      placeholder="e.g. Morning Shift"
                      value={editShiftName}
                      onChange={(e) => setEditShiftName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="input-group">
                      <label className="input-label text-slate-700 dark:text-slate-300">Start Time</label>
                      <input
                        type="text"
                        className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                        placeholder="08:00 AM"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label text-slate-700 dark:text-slate-300">End Time</label>
                      <input
                        type="text"
                        className="custom-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                        placeholder="04:00 PM"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label text-slate-700 dark:text-slate-300">Assign / Reassign Staff</label>
                    <CustomSelect
                      value={editAssignedUser}
                      options={[
                        { value: "Unassigned", label: "Unassigned" },
                        ...staffUsers
                          .filter((u) => u.role === "cashier" || u.role === "chef")
                          .map((u) => ({
                            value: `${u.name} (${u.role})`,
                            label: `${u.name} — ${u.role.toUpperCase()}`,
                          })),
                      ]}
                      onChange={setEditAssignedUser}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label text-slate-700 dark:text-slate-300">Shift Status</label>
                    <CustomSelect
                      value={editStatus}
                      options={[
                        { label: "Active", value: "Active" },
                        { label: "Closed", value: "Closed" },
                      ]}
                      onChange={setEditStatus}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingShift(null)}
                      className="btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary text-xs">
                      Update Shift Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </PageWrapper>
  );
}
