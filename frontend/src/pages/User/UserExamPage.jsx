import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  LogOut,
  CheckCircle2,
  ChevronRight,
  User,
  FileText,
  Clock,
} from "lucide-react";
import {
  candidateMeAPI,
  userTimeDetailsAPI,
  quizResultAPI,
} from "../../utils/api";
import logo from "../../assets/tecnoprism.webp"; // change path to your logo

const roundLabels = [
  "Applied",
  "Aptitude Exam",
  "Technical Interview",
  "HR Interview",
  "Final Decision",
];

export default function UserExamPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [examStatus, setExamStatus] = useState("not-started");
  const [examDuration, setExamDuration] = useState(30);
  const [totalScore, setTotalScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAlreadyStarted, setHasAlreadyStarted] = useState(false);
  const [userPhoto, setUserPhoto] = useState(null);

  const getPhotoSrc = (val) => {
    if (!val) return null;
    if (/^https?:\/\//i.test(val)) {
      const m = val.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]+)/);
      if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w200`;
      return val;
    }
    return `https://drive.google.com/thumbnail?id=${val}&sz=w200`;
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await candidateMeAPI.getMe();
        if (me?.success && me.data) {
          setUser(me.data);

          const time = await userTimeDetailsAPI
            .getByEmail(me.data.email)
            .catch(() => null);

          const record = time?.data || null;
          const anyTime =
            record?.startTime || record?.endTime || record?.completionTime;

          if (anyTime) {
            setHasAlreadyStarted(true);
            if (record?.completionTime || record?.endTime) {
              setExamStatus("completed");
            } else {
              setExamStatus("in-progress");
            }
          }

          if (record?.photo) setUserPhoto(record.photo);

          const qr = await quizResultAPI
            .getQuizResultByEmail(me.data.email)
            .catch(() => null);

          if (qr?.success && qr.data) {
            setTotalScore(qr.data.totalMarks ?? null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStartExam = async () => {
    try {
      await userTimeDetailsAPI.start();
      navigate("/quiz");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/user-login";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const currentRoundIndex =
    examStatus === "completed" ? 2 : examStatus === "in-progress" ? 2 : 1;

  return (
    <div className="min-h-screen bg-slate-100 text-left">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          {/* LEFT: Logo + Title */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
              Candidate Dashboard
            </h1>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5 text-slate-500" />

            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold overflow-hidden">
              {getPhotoSrc(userPhoto) ? (
                <img
                  src={getPhotoSrc(userPhoto)}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              ) : (
                `${user?.firstName?.[0] ?? "J"}${user?.lastName?.[0] ?? "D"}`
              )}
            </div>

            <button onClick={handleLogout}>
              <LogOut className="h-5 w-5 text-slate-500 hover:text-red-500 transition" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* LEFT COLUMN */}
          <div className="flex-1 space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                  {getPhotoSrc(userPhoto) ? (
                    <img
                      src={getPhotoSrc(userPhoto)}
                      alt="User"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    `${user?.firstName?.[0] ?? "J"}${user?.lastName?.[0] ?? "D"}`
                  )}
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                    {user?.firstName} {user?.lastName}
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">{user?.email}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                      Software Developer
                    </span>
                    <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-slate-800">
                Application Progress
              </h3>

              <div className="mt-8 relative space-y-8">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />

                {roundLabels.map((label, i) => {
                  const completed = i < currentRoundIndex;
                  const current = i === currentRoundIndex;

                  return (
                    <div key={i} className="flex items-start gap-5 relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold z-10
                        ${
                          completed
                            ? "bg-green-500 text-white"
                            : current
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          i + 1
                        )}
                      </div>

                      <div>
                        <p
                          className={`text-sm font-medium ${
                            current
                              ? "text-blue-600"
                              : completed
                                ? "text-slate-800"
                                : "text-slate-500"
                          }`}
                        >
                          {label}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {current ? "Feb 5, 2026" : "Pending"}
                        </p>

                        {current && (
                          <span className="mt-2 inline-block text-xs border border-blue-300 text-blue-600 px-3 py-1 rounded-full">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-[320px] space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Quick Actions
              </h3>

              <div className="mt-5 space-y-3">
                <button
                  onClick={handleStartExam}
                  className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 flex justify-between items-center text-sm font-medium hover:bg-blue-700 transition"
                >
                  Start Exam
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button className="w-full border border-slate-200 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm hover:bg-slate-50 transition">
                  <User className="h-4 w-4" />
                  View Profile
                </button>

                <button className="w-full border border-slate-200 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm hover:bg-slate-50 transition">
                  <FileText className="h-4 w-4" />
                  My Documents
                </button>

                <button className="w-full border border-slate-200 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm hover:bg-slate-50 transition">
                  <Clock className="h-4 w-4" />
                  Exam History
                </button>
              </div>
            </div>

            {/* Status Cards */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-xs text-slate-400">Current Round</p>
                <p className="text-lg font-semibold text-slate-800 mt-1">
                  Round {currentRoundIndex + 1}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {roundLabels[currentRoundIndex]}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-xs text-slate-400">Exam Score</p>
                <p className="text-lg font-semibold text-slate-800 mt-1">
                  {totalScore ?? "87"}/100
                </p>
                <p className="text-xs text-green-600 mt-1">Passed</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-xs text-slate-400">Next Step</p>
                <p className="text-lg font-semibold text-slate-800 mt-1">
                  Feb 5
                </p>
                <p className="text-xs text-slate-500 mt-1">10:00 AM EST</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
