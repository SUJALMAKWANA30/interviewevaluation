import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Users,
  Play,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { scheduleAPI, driveAPI, adminAPI, candidateAPI } from "../../utils/apiClient";
import { usePermissions } from "../../hooks/usePermissions";
import { useDrive } from "../../context/DriveContext";

const ROUND_OPTIONS = ["R2", "R3", "R4"];
const STATUS_COLORS = {
  scheduled: "bg-blue-100 text-blue-700",
  "in-progress": "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-500",
  "no-show": "bg-red-100 text-red-700",
  rescheduled: "bg-purple-100 text-purple-700",
};
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

export default function SchedulePage() {
  const { can, isSuperAdmin } = usePermissions();
  const { selectedDrive: activeDrive } = useDrive();

  const [schedules, setSchedules] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [stats, setStats] = useState(null);

  // Filters
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedRound, setSelectedRound] = useState("R2");

  // Auto-schedule form
  const [showAutoForm, setShowAutoForm] = useState(false);
  const [autoForm, setAutoForm] = useState({
    round: "R2",
    date: new Date().toISOString().split("T")[0],
    startHour: 9,
    endHour: 17,
    slotDuration: 30,
  });

  useEffect(() => {
    fetchData();
  }, [activeDrive]);

  useEffect(() => {
    if (activeDrive?._id) {
      fetchSchedules();
    }
  }, [selectedDate, selectedRound, activeDrive]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [adminAPI.getInterviewerNames()];
      if (activeDrive?._id) {
        promises.push(
          scheduleAPI.getStats(activeDrive._id),
          candidateAPI.getAll(activeDrive._id)
        );
      }
      const results = await Promise.all(promises);
      setInterviewers(results[0]?.data || []);
      if (results[1]) setStats(results[1]?.data || null);
      if (results[2]) setCandidates(results[2]?.data || []);
    } catch (err) {
      console.error("Failed to fetch schedule data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    if (!activeDrive?._id) return;
    try {
      const res = await scheduleAPI.getAll({
        driveId: activeDrive._id,
        date: selectedDate,
        round: selectedRound,
      });
      setSchedules(res.data || []);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    }
  };

  const handleAutoSchedule = async () => {
    if (!activeDrive?._id) {
      toast.error("No active drive selected");
      return;
    }

    // Get unscheduled candidates for the selected round
    const unscheduledIds = candidates
      .filter((c) => c.status === "qualified" || c.status === "registered")
      .map((c) => c._id);

    if (unscheduledIds.length === 0) {
      toast.error("No eligible candidates to schedule");
      return;
    }

    setAutoScheduling(true);
    try {
      const res = await scheduleAPI.autoSchedule({
        driveId: activeDrive._id,
        candidateIds: unscheduledIds,
        round: autoForm.round,
        date: autoForm.date,
        startHour: autoForm.startHour,
        endHour: autoForm.endHour,
        slotDuration: autoForm.slotDuration,
      });
      const { scheduled, waitlisted } = res.data || {};
      toast.success(
        `Scheduled ${scheduled?.length || 0} candidates. ${waitlisted?.length || 0} waitlisted.`
      );
      setShowAutoForm(false);
      fetchSchedules();
      fetchData();
    } catch (err) {
      toast.error(err.message || "Auto-schedule failed");
    } finally {
      setAutoScheduling(false);
    }
  };

  const handleCancelSchedule = async (id) => {
    if (!confirm("Cancel this interview slot?")) return;
    try {
      await scheduleAPI.cancel(id);
      toast.success("Schedule cancelled");
      fetchSchedules();
    } catch (err) {
      toast.error(err.message || "Failed to cancel");
    }
  };

  // Build timeline grid data: interviewers as rows, hours as columns
  const timelineData = useMemo(() => {
    return interviewers.map((interviewer) => {
      const slots = schedules.filter(
        (s) =>
          (s.interviewerId?._id || s.interviewerId) === interviewer._id
      );
      return { interviewer, slots };
    });
  }, [interviewers, schedules]);

  const moveDate = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 text-left">
          Interview Schedule
        </h1>
        <p className="text-gray-500 text-sm text-left">
          Auto-distribute candidates among interviewers.
          {activeDrive && (
            <span className="ml-1 text-blue-600 font-medium">
              Drive: {activeDrive.name}
            </span>
          )}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Scheduled",
              value: stats.scheduled || 0,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Completed",
              value: stats.completed || 0,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Cancelled",
              value: stats.cancelled || 0,
              color: "text-gray-500",
              bg: "bg-gray-50",
            },
            {
              label: "No-show",
              value: stats["no-show"] || 0,
              color: "text-red-600",
              bg: "bg-red-50",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} rounded-xl p-4 border border-gray-200`}
            >
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Date nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => moveDate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={() => moveDate(1)}
              className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Round selector */}
          <div className="flex gap-2">
            {ROUND_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRound(r)}
                className={`px-4 py-2 text-sm rounded-lg cursor-pointer ${
                  selectedRound === r
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchSchedules}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <RefreshCw size={16} /> Refresh
            </button>

            {(can("scheduling", "assign") || isSuperAdmin) && (
              <button
                onClick={() => setShowAutoForm(!showAutoForm)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
              >
                <Play size={16} /> Auto Schedule
              </button>
            )}
          </div>
        </div>

        {/* Auto-schedule form */}
        {showAutoForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-4">
              Auto Schedule Settings
            </h3>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Round
                </label>
                <select
                  value={autoForm.round}
                  onChange={(e) =>
                    setAutoForm({ ...autoForm, round: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {ROUND_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={autoForm.date}
                  onChange={(e) =>
                    setAutoForm({ ...autoForm, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Start Hour
                </label>
                <select
                  value={autoForm.startHour}
                  onChange={(e) =>
                    setAutoForm({
                      ...autoForm,
                      startHour: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  End Hour
                </label>
                <select
                  value={autoForm.endHour}
                  onChange={(e) =>
                    setAutoForm({
                      ...autoForm,
                      endHour: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Slot (min)
                </label>
                <select
                  value={autoForm.slotDuration}
                  onChange={(e) =>
                    setAutoForm({
                      ...autoForm,
                      slotDuration: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {[15, 20, 30, 45, 60].map((d) => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => setShowAutoForm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoSchedule}
                disabled={autoScheduling}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {autoScheduling ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Scheduling...
                  </>
                ) : (
                  <>
                    <Play size={16} /> Run Auto Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-10">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Calendar size={18} />
            Schedule for{" "}
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            — {selectedRound}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-40 sticky left-0 bg-gray-50 z-10">
                  Interviewer
                </th>
                {HOURS.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-center font-medium text-gray-500 min-w-25"
                  >
                    {h}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timelineData.map(({ interviewer, slots }) => (
                <tr key={interviewer._id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {interviewer.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <span className="truncate max-w-25">
                        {interviewer.name}
                      </span>
                    </div>
                  </td>
                  {HOURS.map((h) => {
                    const hourStr = String(h).padStart(2, "0");
                    const slot = slots.find((s) => s.startTime?.startsWith(hourStr));
                    return (
                      <td
                        key={h}
                        className="px-1 py-2 text-center align-top"
                      >
                        {slot ? (
                          <div
                            className={`relative group rounded-lg px-2 py-1.5 text-xs ${STATUS_COLORS[slot.status] || "bg-gray-100 text-gray-600"}`}
                          >
                            <p className="font-medium truncate">
                              {slot.candidateId?.name || "Candidate"}
                            </p>
                            <p className="text-[10px] opacity-70">
                              {slot.startTime} - {slot.endTime}
                            </p>
                            {slot.status === "scheduled" && (
                              <button
                                onClick={() => handleCancelSchedule(slot._id)}
                                className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center cursor-pointer"
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="h-10 rounded border border-dashed border-gray-200" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {timelineData.length === 0 && (
                <tr>
                  <td
                    colSpan={HOURS.length + 1}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No interviewers found.</p>
                    <p className="text-xs mt-1">
                      Add HR users with interviewer roles in the Admin Panel.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule List */}
      {schedules.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-10">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Clock size={18} />
              All Slots ({schedules.length})
            </h2>
          </div>
          <div className="px-4 pb-4">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Interviewer</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s._id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {s.candidateId?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {s.interviewerId?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {s.startTime} – {s.endTime}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {s.duration} min
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full ${STATUS_COLORS[s.status] || "bg-gray-100"}`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
