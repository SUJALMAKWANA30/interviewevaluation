import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  Filter,
  Users,
  Award,
  TrendingUp,
  XCircle,
  CheckCircle,
  Clock,
  Loader2,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import * as XLSX from "xlsx";
import { useDrive } from "../../context/DriveContext";
import { candidateAPI, apiClient } from "../../utils/apiClient";
import { usePermissions } from "../../hooks/usePermissions";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function ReportsPage() {
  const { can, isSuperAdmin } = usePermissions();
  const { selectedDriveId, selectedDrive, drives } = useDrive();

  const [candidates, setCandidates] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [dateRange, setDateRange] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const driveParams = selectedDriveId && selectedDriveId !== "all" ? { driveId: selectedDriveId } : {};

    try {
      const [candRes, quizRes, timeRes] = await Promise.allSettled([
        candidateAPI.getAll(driveParams.driveId),
        apiClient.get("/quizresult", driveParams),
        apiClient.get("/user-time-details", driveParams),
      ]);

      const candidatesList = candRes.status === "fulfilled" ? (candRes.value.data || []) : [];
      const quizList = quizRes.status === "fulfilled" ? (quizRes.value.data || []) : [];
      const timeList = timeRes.status === "fulfilled" ? (timeRes.value.data || []) : [];

      // Merge data
      const quizMap = new Map();
      quizList.forEach((q) => {
        const key = (q.email || "").toLowerCase();
        if (key) quizMap.set(key, q);
      });
      const timeMap = new Map();
      timeList.forEach((t) => {
        const key = (t.email || "").toLowerCase();
        if (key) timeMap.set(key, t);
      });

      const merged = candidatesList.map((c) => {
        const email = (c.email || "").toLowerCase();
        const quiz = quizMap.get(email) || {};
        const time = timeMap.get(email) || {};
        return { ...c, quiz, timeDetails: time };
      });

      setCandidates(merged);
      setQuizResults(quizList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDriveId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Drive round names
  const driveRoundNames = selectedDrive?.rounds?.length > 0
    ? selectedDrive.rounds.sort((a, b) => a.order - b.order).map((r) => r.name.toUpperCase())
    : ["R1", "R2", "R3", "R4"];

  // ===== COMPUTED STATS =====
  const stats = useMemo(() => {
    const total = candidates.length;
    const completed = candidates.filter((c) => c.examStatus === "completed").length;
    const inProgress = candidates.filter((c) => c.examStatus === "in_progress").length;
    const notStarted = candidates.filter((c) => c.examStatus === "not_started").length;
    const present = candidates.filter((c) => c.attendance === true || c.examStatus === "completed" || c.examStatus === "in_progress").length;
    const absent = total - present;

    // Score stats
    const scores = candidates.map((c) => parseInt(c.quiz?.totalMarks || c.quiz?.["Final Score"]) || 0).filter((s) => s > 0);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passCount = scores.filter((s) => s >= 13).length;
    const failCount = scores.filter((s) => s > 0 && s < 13).length;

    // Round stats
    const getRoundCount = (roundName, status) => {
      return candidates.filter((c) => {
        if (roundName === "R1") {
          const score = parseInt(c.quiz?.["Final Score"] || c.quiz?.totalMarks) || 0;
          if (status === "completed") return score >= 13;
          if (status === "dropped") return score > 0 && score < 13;
          return false;
        }
        const rd = c.quiz?.[roundName];
        if (!Array.isArray(rd) || !rd[0]) return false;
        const s = (rd[0].status || "").toLowerCase();
        if (status === "completed") return s === "completed";
        if (status === "dropped") return s === "drop" || s === "dropped";
        if (status === "in-progress") return s === "in progress" || s === "in-progress";
        if (status === "rejected") return s === "rejected";
        return false;
      }).length;
    };

    const roundStats = driveRoundNames.map((r) => ({
      name: r,
      completed: getRoundCount(r, "completed"),
      inProgress: getRoundCount(r, "in-progress"),
      dropped: getRoundCount(r, "dropped"),
      rejected: getRoundCount(r, "rejected"),
    }));

    return { total, completed, inProgress, notStarted, present, absent, avgScore, maxScore, minScore, passCount, failCount, roundStats };
  }, [candidates, driveRoundNames]);

  // ===== CHART DATA =====
  const examStatusData = useMemo(() => [
    { name: "Completed", value: stats.completed, color: "#22c55e" },
    { name: "In Progress", value: stats.inProgress, color: "#3b82f6" },
    { name: "Not Started", value: stats.notStarted, color: "#9ca3af" },
  ].filter((d) => d.value > 0), [stats]);

  const attendanceData = useMemo(() => [
    { name: "Present", value: stats.present, color: "#22c55e" },
    { name: "Absent", value: stats.absent, color: "#ef4444" },
  ].filter((d) => d.value > 0), [stats]);

  const scoreDistribution = useMemo(() => {
    const ranges = [
      { range: "0-5", min: 0, max: 5 },
      { range: "6-10", min: 6, max: 10 },
      { range: "11-15", min: 11, max: 15 },
      { range: "16-20", min: 16, max: 20 },
      { range: "21-25", min: 21, max: 25 },
      { range: "26-30", min: 26, max: 30 },
      { range: "31+", min: 31, max: 999 },
    ];
    return ranges.map((r) => ({
      range: r.range,
      count: candidates.filter((c) => {
        const s = parseInt(c.quiz?.totalMarks || c.quiz?.["Final Score"]) || 0;
        return s >= r.min && s <= r.max;
      }).length,
    }));
  }, [candidates]);

  const sectionWiseAvg = useMemo(() => {
    const sections = {};
    candidates.forEach((c) => {
      const quiz = c.quiz || {};
      // Try sectionWiseMarks first
      if (quiz.sectionWiseMarks && Array.isArray(quiz.sectionWiseMarks)) {
        quiz.sectionWiseMarks.forEach((s) => {
          if (!sections[s.sectionName]) sections[s.sectionName] = [];
          sections[s.sectionName].push(s.marks || 0);
        });
      } else {
        // Fallback to known keys
        ["Logical", "GenAI", "Python", "RPA", "Database", "Communication"].forEach((key) => {
          const val = parseFloat(quiz[key]);
          if (!isNaN(val)) {
            if (!sections[key]) sections[key] = [];
            sections[key].push(val);
          }
        });
      }
    });
    return Object.entries(sections).map(([name, vals]) => ({
      section: name,
      average: vals.length > 0 ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : 0,
      max: vals.length > 0 ? Math.max(...vals) : 0,
      count: vals.length,
    }));
  }, [candidates]);

  const roundPipelineData = useMemo(() => {
    return stats.roundStats.map((r) => ({
      name: r.name,
      Completed: r.completed,
      "In Progress": r.inProgress,
      Dropped: r.dropped,
      Rejected: r.rejected,
    }));
  }, [stats.roundStats]);

  // ===== EXPORT =====
  const exportReport = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Metric", "Value"],
      ["Total Candidates", stats.total],
      ["Present", stats.present],
      ["Absent", stats.absent],
      ["Exam Completed", stats.completed],
      ["Exam In Progress", stats.inProgress],
      ["Avg Score", stats.avgScore],
      ["Max Score", stats.maxScore],
      ["Pass (≥13)", stats.passCount],
      ["Fail (<13)", stats.failCount],
      ["Drive", selectedDrive?.name || "All Drives"],
      ["Generated", new Date().toLocaleString()],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

    // Round pipeline sheet
    const roundHeader = ["Round", "Completed", "In Progress", "Dropped", "Rejected"];
    const roundRows = stats.roundStats.map((r) => [r.name, r.completed, r.inProgress, r.dropped, r.rejected]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([roundHeader, ...roundRows]), "Round Pipeline");

    // Candidates detail sheet
    const candHeader = ["Name", "Email", "Phone", "Status", "Score", "R2 Status", "R2 Rating", "R3 Status", "R4 Status", "R4 Rating"];
    const candRows = candidates.map((c) => {
      const quiz = c.quiz || {};
      const r2 = Array.isArray(quiz.R2) && quiz.R2[0] ? quiz.R2[0] : {};
      const r3 = Array.isArray(quiz.R3) && quiz.R3[0] ? quiz.R3[0] : {};
      const r4 = Array.isArray(quiz.R4) && quiz.R4[0] ? quiz.R4[0] : {};
      return [
        `${c.firstName || ""} ${c.lastName || ""}`.trim(),
        c.email,
        c.phone || "",
        c.examStatus || "",
        quiz["Final Score"] || quiz.totalMarks || "",
        r2.status || "",
        r2.rating || "",
        r3.status || "",
        r4.status || "",
        r4.rating || "",
      ];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([candHeader, ...candRows]), "Candidates");

    // Section avg sheet
    const secHeader = ["Section", "Average", "Max", "Attempts"];
    const secRows = sectionWiseAvg.map((s) => [s.section, s.average, s.max, s.count]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([secHeader, ...secRows]), "Section Analysis");

    const driveName = selectedDrive?.name || "AllDrives";
    XLSX.writeFile(wb, `Report_${driveName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ===== STAT CARD =====
  const StatCard = ({ icon: Icon, label, value, subValue, color, trend }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
  );

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3">
        <p className="text-sm font-semibold text-gray-800 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: <span className="font-medium">{p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 text-left">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 text-left mt-1">
            {selectedDrive ? selectedDrive.name : "All Drives"} &middot; {candidates.length} candidates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          {(isSuperAdmin || can("reports", "export")) && (
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
              <Download size={16} />
              Export Excel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-fit">
        {[
          { key: "overview", label: "Overview", icon: BarChart3 },
          { key: "rounds", label: "Round Pipeline", icon: Filter },
          { key: "scores", label: "Score Analysis", icon: Award },
          { key: "details", label: "Detailed Data", icon: FileText },
        ].map(({ key, label, icon: TabIcon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <TabIcon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard icon={Users} label="Total Candidates" value={stats.total} color="bg-indigo-500" />
        <StatCard icon={CheckCircle} label="Present" value={stats.present} subValue={`${stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(0) : 0}%`} color="bg-green-500" />
        <StatCard icon={XCircle} label="Absent" value={stats.absent} color="bg-red-500" />
        <StatCard icon={Award} label="Avg Score" value={stats.avgScore} subValue={`Max: ${stats.maxScore}`} color="bg-amber-500" />
        <StatCard icon={TrendingUp} label="Pass (≥13)" value={stats.passCount} subValue={`${stats.passCount + stats.failCount > 0 ? ((stats.passCount / (stats.passCount + stats.failCount)) * 100).toFixed(0) : 0}% rate`} color="bg-cyan-500" />
        <StatCard icon={Clock} label="Exam Completed" value={stats.completed} subValue={`${stats.inProgress} in progress`} color="bg-purple-500" />
      </div>

      {/* TAB: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exam Status Pie */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-left">Exam Status Distribution</h3>
            {examStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={examStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {examStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
            )}
          </div>

          {/* Attendance Pie */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-left">Attendance Overview</h3>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {attendanceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data available</div>
            )}
          </div>

          {/* Score Distribution Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-left">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB: Rounds */}
      {activeTab === "rounds" && (
        <div className="space-y-6">
          {/* Round Pipeline Stacked Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-left">Round Pipeline</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={roundPipelineData} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Completed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="In Progress" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Dropped" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Rejected" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Round Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.roundStats.map((r) => {
              const total = r.completed + r.inProgress + r.dropped + r.rejected;
              return (
                <div key={r.name} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-800">{r.name}</h4>
                    <span className="text-xs text-gray-400">{total} candidates</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Completed", count: r.completed, color: "bg-green-500" },
                      { label: "In Progress", count: r.inProgress, color: "bg-blue-500" },
                      { label: "Dropped", count: r.dropped, color: "bg-amber-500" },
                      { label: "Rejected", count: r.rejected, color: "bg-red-500" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-xs text-gray-600 flex-1">{item.label}</span>
                        <span className="text-xs font-semibold text-gray-800">{item.count}</span>
                        {total > 0 && (
                          <span className="text-[10px] text-gray-400 w-10 text-right">
                            {((item.count / total) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  {total > 0 && (
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="bg-green-500 h-full" style={{ width: `${(r.completed / total) * 100}%` }} />
                      <div className="bg-blue-500 h-full" style={{ width: `${(r.inProgress / total) * 100}%` }} />
                      <div className="bg-amber-500 h-full" style={{ width: `${(r.dropped / total) * 100}%` }} />
                      <div className="bg-red-500 h-full" style={{ width: `${(r.rejected / total) * 100}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: Scores */}
      {activeTab === "scores" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section-wise Average Radar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-left">Section-wise Performance</h3>
            {sectionWiseAvg.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={sectionWiseAvg}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="section" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Radar name="Average" dataKey="average" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  <Radar name="Max" dataKey="max" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No section data available</div>
            )}
          </div>

          {/* Section-wise Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-left">Section-wise Average Scores</h3>
            {sectionWiseAvg.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sectionWiseAvg} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <YAxis type="category" dataKey="section" tick={{ fontSize: 11, fill: "#6b7280" }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="average" fill="#6366f1" radius={[0, 6, 6, 0]} name="Average" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No section data available</div>
            )}
          </div>

          {/* Pass/Fail Donut */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-left">R1 Pass / Fail Ratio</h3>
            {(stats.passCount > 0 || stats.failCount > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pass (≥13)", value: stats.passCount, color: "#22c55e" },
                      { name: "Fail (<13)", value: stats.failCount, color: "#ef4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No score data available</div>
            )}
          </div>

          {/* Score Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-left">Score Summary</h3>
            <div className="space-y-3">
              {[
                { label: "Average Score", value: stats.avgScore, color: "text-indigo-600" },
                { label: "Highest Score", value: stats.maxScore, color: "text-green-600" },
                { label: "Lowest Score", value: stats.minScore, color: "text-red-600" },
                { label: "Candidates Scored", value: `${stats.passCount + stats.failCount} / ${stats.total}`, color: "text-gray-700" },
                { label: "Pass Count (≥13)", value: stats.passCount, color: "text-green-600" },
                { label: "Fail Count (<13)", value: stats.failCount, color: "text-red-600" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Details */}
      {activeTab === "details" && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Candidate Details</h3>
            <span className="text-xs text-gray-400">{candidates.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">R1 Score</th>
                  {driveRoundNames.filter((r) => r !== "R1").map((r) => (
                    <th key={r} className="px-4 py-3">{r} Status</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.slice(0, 100).map((c, idx) => {
                  const quiz = c.quiz || {};
                  const score = quiz["Final Score"] || quiz.totalMarks || "—";
                  const statusColors = {
                    completed: "bg-green-100 text-green-700",
                    in_progress: "bg-blue-100 text-blue-700",
                    not_started: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <tr key={c._id || idx} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {`${c.firstName || ""} ${c.lastName || ""}`.trim() || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[c.examStatus] || statusColors.not_started}`}>
                          {(c.examStatus || "not_started").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{score}</td>
                      {driveRoundNames.filter((r) => r !== "R1").map((r) => {
                        const rd = Array.isArray(quiz[r]) && quiz[r][0] ? quiz[r][0] : {};
                        const st = (rd.status || "—").toLowerCase();
                        const rdColors = {
                          completed: "text-green-600",
                          "in progress": "text-blue-600",
                          drop: "text-amber-600",
                          rejected: "text-red-600",
                        };
                        return (
                          <td key={r} className={`px-4 py-3 text-xs font-medium capitalize ${rdColors[st] || "text-gray-400"}`}>
                            {st === "—" ? "—" : st}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan={5 + driveRoundNames.filter((r) => r !== "R1").length} className="px-4 py-12 text-center text-gray-400">
                      No candidates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {candidates.length > 100 && (
            <div className="px-6 py-3 text-xs text-gray-400 border-t border-gray-100">
              Showing first 100 records. Export to Excel for full data.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
