import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
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
} from "recharts";

import { useDrive } from "../../context/DriveContext";
import { candidateAPI, examAPI, apiClient } from "../../utils/apiClient";

export default function HrDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedDriveId, selectedDrive } = useDrive();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const driveParams =
        selectedDriveId && selectedDriveId !== "all"
          ? { driveId: selectedDriveId }
          : {};

      try {
        const [candRes, quizRes, examRes] = await Promise.allSettled([
          candidateAPI.getAll(driveParams.driveId),
          apiClient.get("/quizresult", driveParams),
          examAPI.getAll(),
        ]);

        if (candRes.status === "fulfilled") {
          setCandidates(candRes.value.data || []);
        }
        if (quizRes.status === "fulfilled") {
          setQuizResults(quizRes.value.data || []);
        }
        if (examRes.status === "fulfilled") {
          setExams(examRes.value.data || []);
        }
      } catch {
        // silently continue with empty data
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDriveId]);

  // Compute stats from real data
  const totalCandidates = candidates.length;
  const activeExams = exams.filter((e) => e.isActive).length;
  const completedExams = candidates.filter(
    (c) => c.examStatus === "completed",
  ).length;
  const inProgressExams = candidates.filter(
    (c) => c.examStatus === "in_progress",
  ).length;
  const notStartedExams = candidates.filter(
    (c) => c.examStatus === "not_started",
  ).length;
  const passRate =
    quizResults.length > 0
      ? (
          (quizResults.filter((q) => q.totalMarks >= 13).length /
            quizResults.length) *
          100
        ).toFixed(1)
      : "0";

  const stats = [
    {
      label: "Total Candidates",
      value: totalCandidates.toLocaleString(),
      change: `${completedExams} completed`,
      trending: "up",
      icon: Users,
    },
    {
      label: "Active Exams",
      value: String(activeExams),
      change: `${exams.length} total`,
      trending: "up",
      icon: Briefcase,
    },
    {
      label: "Pass Rate",
      value: `${passRate}%`,
      change: `${quizResults.length} attempted`,
      trending: Number(passRate) >= 50 ? "up" : "down",
      icon: TrendingUp,
    },
    {
      label: "Pending / In Progress",
      value: String(inProgressExams + notStartedExams),
      change: `${inProgressExams} in progress`,
      trending: inProgressExams > 0 ? "up" : "down",
      icon: Clock,
    },
  ];

  // Pie data from real stats
  const pieData = useMemo(
    () => [
      { name: "Not Started", value: notStartedExams || 0, color: "#94a3b8" },
      { name: "In Progress", value: inProgressExams || 0, color: "#f59e0b" },
      { name: "Completed", value: completedExams || 0, color: "#22c55e" },
      {
        name: "Quiz Submitted",
        value: quizResults.length || 0,
        color: "#2563eb",
      },
    ],
    [notStartedExams, inProgressExams, completedExams, quizResults.length],
  );

  // Bar data: group candidates by registration month
  const barData = useMemo(() => {
    const monthMap = {};
    const quizMonthMap = {};
    candidates.forEach((c) => {
      if (c.createdAt) {
        const d = new Date(c.createdAt);
        const key = d.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        monthMap[key] = (monthMap[key] || 0) + 1;
      }
    });
    quizResults.forEach((q) => {
      if (q.createdAt) {
        const d = new Date(q.createdAt);
        const key = d.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        quizMonthMap[key] = (quizMonthMap[key] || 0) + 1;
      }
    });
    const allMonths = [
      ...new Set([...Object.keys(monthMap), ...Object.keys(quizMonthMap)]),
    ];
    // Sort by date
    allMonths.sort((a, b) => {
      const da = new Date(`1 ${a}`);
      const db = new Date(`1 ${b}`);
      return da - db;
    });
    return allMonths.slice(-6).map((month) => ({
      month,
      registrations: monthMap[month] || 0,
      quizCompleted: quizMonthMap[month] || 0,
    }));
  }, [candidates, quizResults]);

  // Recent activity from candidates sorted by createdAt
  const recentActivity = useMemo(() => {
    const sorted = [...candidates].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    return sorted.slice(0, 5).map((c) => {
      const timeDiff = Date.now() - new Date(c.createdAt).getTime();
      const mins = Math.floor(timeDiff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      let timeStr;
      if (days > 0) timeStr = `${days} day${days > 1 ? "s" : ""} ago`;
      else if (hours > 0) timeStr = `${hours} hour${hours > 1 ? "s" : ""} ago`;
      else timeStr = `${mins} min${mins !== 1 ? "s" : ""} ago`;

      const action =
        c.examStatus === "completed"
          ? "completed the exam"
          : c.examStatus === "in_progress"
            ? "started the exam"
            : "registered as a candidate";
      return {
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unknown",
        action,
        time: timeStr,
      };
    });
  }, [candidates]);

  if (loading) {
    return (
      <div className="w-full text-left animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-10">
          <div className="h-7 w-48 bg-gray-200 rounded-md"></div>
          <div className="mt-2 h-4 w-80 bg-gray-100 rounded-md"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white px-6 py-5"
            >
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>

              <div className="mt-5">
                <div className="h-8 w-20 bg-gray-300 rounded-md"></div>
                <div className="mt-2 h-4 w-32 bg-gray-200 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* Bar Chart */}
          <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm xl:col-span-3">
            <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-32 bg-gray-100 rounded mb-6"></div>
            <div className="h-64 bg-gray-100 rounded-xl"></div>
          </div>

          {/* Pie Chart */}
          <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm xl:col-span-2">
            <div className="h-4 w-40 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-28 bg-gray-100 rounded mb-6"></div>
            <div className="h-64 bg-gray-100 rounded-full"></div>
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
          <div className="h-4 w-40 bg-gray-200 rounded mb-6"></div>

          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-5 border-b border-gray-100 last:border-none"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 w-40 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-24 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-left">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900">
          Dashboard
          {selectedDrive && (
            <span className="ml-2 text-base font-normal text-blue-600">
              — {selectedDrive.name}
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {selectedDrive
            ? `Showing data for ${selectedDrive.name} (${selectedDrive.location})`
            : "Recruitment overview from real-time data (all drives)."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white px-6 py-5 transition-all duration-300 ease-out hover:-translate-z-1 hover:shadow-lg hover:shadow-blue-100"
          >
            {/* Top Row */}
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <stat.icon className="h-5 w-5 text-blue-600" />
              </div>

              <span
                className={`flex items-center gap-1 text-xs font-semibold ${
                  stat.trending === "up" ? "text-green-600" : "text-red-500"
                }`}
              >
                {stat.trending === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {stat.change}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm xl:col-span-3">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-900">
              Registrations vs Quiz Completions
            </h3>
            <p className="text-xs text-gray-500">Recent months</p>
          </div>

          <div className="h-64">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid stroke="#f3f4f6" strokeDasharray="4 4" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar
                    dataKey="registrations"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="quizCompleted"
                    fill="#14b8a6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No data available yet
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm xl:col-span-2">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-900">
              Pipeline Breakdown
            </h3>
            <p className="text-xs text-gray-500">Current candidate status</p>
          </div>

          <div className="h-64">
            {pieData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {pieData
                      .filter((d) => d.value > 0)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name) => [`${value}`, name]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No data available yet
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-gray-600">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">
          Recent Activity
        </h3>

        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                    {item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{item.name}</span>{" "}
                      {item.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 py-5">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
