import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight } from "lucide-react";
import {
  candidateMeAPI,
  userTimeDetailsAPI,
  quizResultAPI,
} from "../../utils/api";
import logo from "../../assets/tecnoprism.webp";
import ProfilePopup from "../../components/User/ProfilePopup";

const roundLabels = [
  "Applied",
  "Aptitude Exam",
  "Technical Interview",
  "HR Interview",
  "Final Decision",
];

export default function UserDashboard() {
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
            <img src={logo} alt="Logo" className="h-15 w-auto object-contain" />
            {/* <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
              Candidate Dashboard
            </h1> */}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center cursor-pointer">
            <ProfilePopup user={user} onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEFT COLUMN */}
          <div className="space-y-10">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
                  {`${user?.firstName?.[0] ?? "J"}${user?.lastName?.[0] ?? "D"}`}
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-slate-800">
                    {user?.firstName} {user?.lastName}
                  </h2>

                  <p className="text-sm text-slate-500">{user?.email}</p>

                  {/* <div className="flex gap-2 pt-2">
                    <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                      Software Developer
                    </span>
                    <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">
                      Active
                    </span>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-6">
                Quick Actions
              </h3>

              <div className="space-y-4">
                <button
                  onClick={handleStartExam}
                  className="w-full bg-blue-600 text-white rounded-lg px-5 py-3 flex justify-between items-center text-sm font-medium hover:bg-blue-700 transition"
                >
                  Start Exam
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Current Round */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                Current Round
              </p>

              <div className="pt-3 space-y-1">
                <p className="text-2xl font-semibold text-slate-800">
                  Round {currentRoundIndex + 1}
                </p>
                <p className="text-sm text-blue-600 font-medium">
                  {roundLabels[currentRoundIndex]}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h3 className="text-lg font-semibold text-slate-800">
              Application Progress
            </h3>

            <div className="mt-10 relative space-y-10">
              {/* Vertical Line */}
              <div className="absolute left-4 top-3 bottom-3 w-px bg-slate-200" />

              {roundLabels.map((label, i) => {
                const completed = i < currentRoundIndex;
                const current = i === currentRoundIndex;

                return (
                  <div key={i} className="flex items-start gap-6 relative">
                    {/* Circle */}
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
                      {completed ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>

                    {/* Text */}
                    <div className="space-y-1">
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

                      <p className="text-xs text-slate-400">
                        {current ? "Feb 5, 2026" : "Pending"}
                      </p>

                      {current && (
                        <span className="inline-block text-xs border border-blue-300 text-blue-600 px-3 py-1 rounded-full mt-2">
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
      </main>
    </div>
  );
}
