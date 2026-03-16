import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, Clock, XCircle } from "lucide-react";
import {
  candidateMeAPI,
  userTimeDetailsAPI,
  quizResultAPI,
} from "../../utils/api";
import logo from "../../assets/tecnoprism.webp";
import ProfilePopup from "../../components/User/ProfilePopup";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api$/, "");

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [examStatus, setExamStatus] = useState("not-started");
  const [totalScore, setTotalScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAlreadyStarted, setHasAlreadyStarted] = useState(false);
  const [userPhoto, setUserPhoto] = useState(null);
  const [driveRounds, setDriveRounds] = useState([]);
  const [quizRoundData, setQuizRoundData] = useState(null);

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

          // Extract drive rounds if drive is populated
          const drive = me.data.driveId;
          if (drive && typeof drive === "object" && drive.rounds?.length > 0) {
            setDriveRounds(
              [...drive.rounds].sort((a, b) => a.order - b.order)
            );
          }

          // Photo from documents
          const photoId = me.data.documents?.photo;
          if (photoId) setUserPhoto(photoId);

          // Fetch userTimeDetails
          const email = me.data.email;
          const time = await userTimeDetailsAPI
            .getByEmail(email)
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

          if (record?.photo && !photoId) setUserPhoto(record.photo);

          // Fetch quiz result (R1 score)
          const qr = await quizResultAPI
            .getQuizResultByEmail(email)
            .catch(() => null);
          if (qr?.success && qr.data) {
            setTotalScore(qr.data.totalMarks ?? null);
            setQuizRoundData(qr.data);
          }
        }
      } catch {
        // failed to load
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStartExam = async () => {
    try {
      await userTimeDetailsAPI.start();
      navigate("/quiz");
    } catch {
      // failed
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userType");
    window.location.href = "/user-login";
  };

  // Build stepper steps from drive rounds
  const buildSteps = () => {
    const steps = [{ id: "applied", label: "Applied", type: "milestone" }];

    if (driveRounds.length > 0) {
      driveRounds.forEach((r) => {
        steps.push({ id: r.name, label: r.name, type: r.type });
      });
    } else {
      // Fallback: default rounds
      steps.push({ id: "R1", label: "R1", type: "Exam" });
      steps.push({ id: "R2", label: "R2", type: "Interview" });
      steps.push({ id: "R3", label: "R3", type: "Interview" });
      steps.push({ id: "R4", label: "R4", type: "Interview" });
    }

    return steps;
  };

  // Determine round status from quiz result data stored in this backend
  const getRoundStatus = (roundId) => {
    if (roundId === "applied") return "completed";

    // R1 / Exam round
    if (roundId.toUpperCase() === "R1") {
      if (totalScore !== null && totalScore !== undefined) return "completed";
      if (examStatus === "in-progress") return "in-progress";
      return "not-started";
    }

    // For interview rounds (R2, R3, R4, etc.) — check persisted quiz result data
    if (quizRoundData) {
      const roundData = quizRoundData[roundId.toUpperCase()] || quizRoundData[roundId];
      if (Array.isArray(roundData) && roundData.length > 0 && roundData[0]) {
        const entry = roundData[0];
        const status = (entry.status || "").toLowerCase().trim();
        if (status === "completed" || status === "complete") return "completed";
        if (status === "drop" || status === "dropped") return "dropped";
        if (status === "rejected" || status === "reject") return "dropped";
        if (status === "in progress" || status === "in-progress") return "in-progress";
        if (entry.interviewer || entry.rating || entry.managerialStatus) return "in-progress";
      }
    }

    return "not-started";
  };

  const steps = buildSteps();

  // Calculate current round index
  const getCurrentRoundIndex = () => {
    let lastCompleted = -1;
    for (let i = 0; i < steps.length; i++) {
      const status = getRoundStatus(steps[i].id);
      if (status === "completed") lastCompleted = i;
      if (status === "in-progress") return i;
    }
    return Math.min(lastCompleted + 1, steps.length - 1);
  };

  const currentRoundIndex = getCurrentRoundIndex();

  const getRoundDisplayName = (step) => {
    if (!step) return "—";
    if (step.id === "applied") return "Applied";
    if (step.type === "Exam") return `${step.label} — Aptitude Exam`;
    return `${step.label} — Interview`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-left animate-pulse">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="h-10 w-40 bg-slate-200 rounded"></div>
            <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-10">
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-slate-200"></div>
                  <div className="space-y-3">
                    <div className="h-5 w-40 bg-slate-300 rounded"></div>
                    <div className="h-4 w-56 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="h-4 w-32 bg-slate-300 rounded mb-6"></div>
                <div className="h-11 w-full bg-slate-200 rounded-lg"></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="h-6 w-48 bg-slate-300 rounded mb-10"></div>
              <div className="space-y-10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-6">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-slate-300 rounded"></div>
                      <div className="h-3 w-24 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const photoSrc = getPhotoSrc(userPhoto);

  return (
    <div className="min-h-screen bg-slate-100 text-left">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-15 w-auto object-contain" />
          </div>
          <div className="flex items-center">
            <ProfilePopup user={user} onLogout={handleLogout} photoSrc={photoSrc} />
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
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
                    {`${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`}
                  </div>
                )}
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-slate-800">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                  {user?.phone && (
                    <p className="text-sm text-slate-400">{user.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-6">
                Quick Actions
              </h3>
              <div className="space-y-4">
                {examStatus === "completed" ? (
                  <div className="w-full bg-green-50 border border-green-200 rounded-lg px-5 py-3 flex justify-between items-center text-sm font-medium text-green-700">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Exam Completed
                    </span>
                    {totalScore !== null && (
                      <span className="bg-green-100 px-3 py-1 rounded-full text-xs font-bold">
                        Score: {totalScore}/30
                      </span>
                    )}
                  </div>
                ) : examStatus === "in-progress" ? (
                  <button
                    onClick={() => navigate("/quiz")}
                    className="w-full bg-amber-500 text-white rounded-lg px-5 py-3 flex justify-between items-center text-sm font-medium hover:bg-amber-600 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Continue Exam
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleStartExam}
                    className="w-full bg-blue-600 text-white rounded-lg px-5 py-3 flex justify-between items-center text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
                  >
                    Start Exam
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Current Round */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8">
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                Current Round
              </p>
              <div className="pt-3 space-y-1">
                <p className="text-2xl font-semibold text-slate-800">
                  {steps[currentRoundIndex]?.label || "—"}
                </p>
                <p className="text-sm text-blue-600 font-medium">
                  {getRoundDisplayName(steps[currentRoundIndex])}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Stepper */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h3 className="text-lg font-semibold text-slate-800">
              Application Progress
            </h3>

            <div className="mt-10 relative space-y-10">
              {/* Vertical Line */}
              <div className="absolute left-4 top-3 bottom-3 w-px bg-slate-200" />

              {steps.map((step, i) => {
                const status = getRoundStatus(step.id);
                const completed = status === "completed";
                const inProgress = status === "in-progress";
                const dropped = status === "dropped";
                const current = i === currentRoundIndex;

                return (
                  <div key={step.id} className="flex items-start gap-6 relative">
                    {/* Circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold z-10 ${
                        dropped
                          ? "bg-red-500 text-white"
                          : completed
                            ? "bg-green-500 text-white"
                            : inProgress || current
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {dropped ? (
                        <XCircle className="h-4 w-4" />
                      ) : completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        i + 1
                      )}
                    </div>

                    {/* Text */}
                    <div className="space-y-1">
                      <p
                        className={`text-sm font-medium ${
                          dropped
                            ? "text-red-600"
                            : current || inProgress
                              ? "text-blue-600"
                              : completed
                                ? "text-slate-800"
                                : "text-slate-500"
                        }`}
                      >
                        {getRoundDisplayName(step)}
                      </p>

                      <p className="text-xs text-slate-400">
                        {dropped
                          ? "Dropped"
                          : completed
                            ? "Completed"
                            : inProgress
                              ? "In Progress"
                              : "Pending"}
                      </p>

                      {step.type === "Exam" && totalScore !== null && completed && (
                        <span className="inline-block text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full mt-1 font-semibold">
                          Score: {totalScore}/30
                        </span>
                      )}

                      {(inProgress || current) && !completed && !dropped && (
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