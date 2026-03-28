import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Code2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { examAPI } from "../../utils/apiClient";
import { useDrive } from "../../context/DriveContext";

const defaultQuestion = () => ({
  id: Math.random().toString(36).substring(2, 9),
  question: "",
  codeSnippet: "",
  showCodeBlock: false,
  codeLanguage: "javascript",
  options: ["", "", "", ""],
  correctAnswer: 0,
});

const defaultSection = () => ({
  id: Math.random().toString(36).substring(2, 9),
  title: "",
  duration: 10,
  collapsed: false,
  questions: [],
});

export default function ExamBuilder() {
  const navigate = useNavigate();
  const { id: examId } = useParams();
  const { selectedDriveId } = useDrive();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState({
    title: "",
    duration: 30,
    sections: [],
    driveId: null,
  });

  const [deleteConfig, setDeleteConfig] = useState({
    open: false,
    type: null,
    sectionId: null,
    questionId: null,
  });

  // Load existing exam for editing
  useEffect(() => {
    if (examId) {
      setLoading(true);
      examAPI
        .getById(examId)
        .then((res) => {
          if (res.success && res.data) {
            const d = res.data;
            setExam({
              title: d.title || "",
              duration: d.duration || 30,
              driveId: d.driveId || null,
              sections: (d.sections || []).map((s) => ({
                id: s._id || Math.random().toString(36).substring(2, 9),
                title: s.title || "",
                duration: s.duration || 10,
                collapsed: false,
                questions: (s.questions || []).map((q) => ({
                  id: q._id || Math.random().toString(36).substring(2, 9),
                  question: q.question || "",
                  codeSnippet: q.codeSnippet || "",
                  showCodeBlock: Boolean((q.codeSnippet || "").trim().length),
                  codeLanguage: q.codeLanguage || "javascript",
                  options: q.options || ["", "", "", ""],
                  correctAnswer: q.correctAnswer ?? 0,
                })),
              })),
            });
          }
        })
        .catch(() => toast.error("Failed to load exam"))
        .finally(() => setLoading(false));
    }
  }, [examId]);

  // Save exam to DB
  const handleSaveExam = async () => {
    if (!exam.title.trim()) {
      toast.error("Please enter an exam title.");
      return;
    }
    if (!exam.sections.length) {
      toast.error("Please add at least one section.");
      return;
    }
    if (!examId && selectedDriveId === "all") {
      toast.error("Please select a drive from the sidebar before creating an exam.");
      return;
    }

    const resolvedDriveId =
      selectedDriveId && selectedDriveId !== "all"
        ? selectedDriveId
        : exam.driveId || null;

    setSaving(true);
    try {
      const payload = {
        title: exam.title,
        duration: Number(exam.duration),
        driveId: resolvedDriveId,
        sections: exam.sections.map((s) => ({
          title: s.title,
          duration: Number(s.duration),
          questions: s.questions.map((q) => ({
            question: q.question,
            codeSnippet: q.showCodeBlock ? q.codeSnippet || "" : "",
            codeLanguage: q.codeLanguage || "javascript",
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
        })),
      };

      let res;
      if (examId) {
        res = await examAPI.update(examId, payload);
      } else {
        res = await examAPI.create(payload);
      }

      if (res.success) {
        toast.success(examId ? "Exam updated!" : "Exam created!");
        navigate("/hr/exam");
      }
    } catch (err) {
      toast.error(err.message || "Failed to save exam.");
    } finally {
      setSaving(false);
    }
  };

  const totalQuestions = exam.sections.reduce(
    (acc, sec) => acc + sec.questions.length,
    0
  );

  /* ================= MOVE SECTION ================= */

  const moveSection = (index, direction) => {
    const newSections = [...exam.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];

    setExam((prev) => ({ ...prev, sections: newSections }));
  };

  /* ================= MOVE QUESTION ================= */

  const moveQuestion = (sectionId, qIndex, direction) => {
    setExam((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;

        const newQuestions = [...sec.questions];
        const targetIndex =
          direction === "up" ? qIndex - 1 : qIndex + 1;

        if (
          targetIndex < 0 ||
          targetIndex >= newQuestions.length
        )
          return sec;

        [newQuestions[qIndex], newQuestions[targetIndex]] = [
          newQuestions[targetIndex],
          newQuestions[qIndex],
        ];

        return { ...sec, questions: newQuestions };
      }),
    }));
  };

  /* ================= TOGGLE ================= */

  const toggleSection = (id) => {
    setExam((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, collapsed: !s.collapsed } : s
      ),
    }));
  };

  /* ================= DELETE ================= */

  const handleConfirmDelete = () => {
    setExam((prev) => {
      if (deleteConfig.type === "section") {
        return {
          ...prev,
          sections: prev.sections.filter(
            (s) => s.id !== deleteConfig.sectionId
          ),
        };
      }

      if (deleteConfig.type === "question") {
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === deleteConfig.sectionId
              ? {
                  ...s,
                  questions: s.questions.filter(
                    (q) => q.id !== deleteConfig.questionId
                  ),
                }
              : s
          ),
        };
      }

      return prev;
    });

    setDeleteConfig({
      open: false,
      type: null,
      sectionId: null,
      questionId: null,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-8 text-left">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Exam Builder
            </h1>
            <p className="text-sm text-gray-500">
              {exam.sections.length} Sections • {totalQuestions} Questions
            </p>
          </div>

          <button
            onClick={handleSaveExam}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : examId ? "Update Exam" : "Save Exam"}
          </button>
        </div>

        {/* EXAM INFO */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <label className="text-sm text-gray-600 block mb-1">
                Exam Title
              </label>
              <input
                value={exam.title}
                onChange={(e) =>
                  setExam({ ...exam, title: e.target.value })
                }
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 block mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={exam.duration}
                onChange={(e) =>
                  setExam({ ...exam, duration: e.target.value })
                }
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTIONS */}
        {exam.sections.map((section, index) => (
          <div key={section.id} className="relative mb-10">

            {/* COLLAPSE BUTTON */}
            <button
              onClick={() => toggleSection(section.id)}
              className="absolute -left-12 top-6 bg-white border border-gray-300 rounded-full p-1 shadow-sm hover:bg-gray-100"
            >
              {section.collapsed ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronUp size={16} />
              )}
            </button>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

              {/* SECTION HEADER */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <span className="bg-gray-100 text-xs px-2 py-1 rounded-full">
                    Section {index + 1}
                  </span>

                  <span className="text-xs text-gray-500">
                    {section.questions.length} Questions
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUp
                    size={16}
                    className="cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => moveSection(index, "up")}
                  />
                  <ArrowDown
                    size={16}
                    className="cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => moveSection(index, "down")}
                  />
                  <Trash2
                    size={16}
                    className="text-gray-400 hover:text-red-500 cursor-pointer"
                    onClick={() =>
                      setDeleteConfig({
                        open: true,
                        type: "section",
                        sectionId: section.id,
                        questionId: null,
                      })
                    }
                  />
                </div>
              </div>

              {!section.collapsed && (
                <>
                  {/* SECTION INFO */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <input
                      placeholder="Section Name"
                      value={section.title}
                      onChange={(e) =>
                        setExam((prev) => ({
                          ...prev,
                          sections: prev.sections.map((s) =>
                            s.id === section.id
                              ? { ...s, title: e.target.value }
                              : s
                          ),
                        }))
                      }
                      className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm"
                    />

                    <input
                      type="number"
                      value={section.duration}
                      onChange={(e) =>
                        setExam((prev) => ({
                          ...prev,
                          sections: prev.sections.map((s) =>
                            s.id === section.id
                              ? { ...s, duration: e.target.value }
                              : s
                          ),
                        }))
                      }
                      className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  {/* QUESTIONS */}
                  {section.questions.map((q, qIndex) => (
                    <div
                      key={q.id}
                      className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Q{qIndex + 1}
                        </span>

                        <div className="flex items-center gap-2">
                          <ArrowUp
                            size={14}
                            className="cursor-pointer text-gray-400 hover:text-gray-600"
                            onClick={() =>
                              moveQuestion(section.id, qIndex, "up")
                            }
                          />
                          <ArrowDown
                            size={14}
                            className="cursor-pointer text-gray-400 hover:text-gray-600"
                            onClick={() =>
                              moveQuestion(section.id, qIndex, "down")
                            }
                          />
                          <Trash2
                            size={14}
                            className="text-gray-400 hover:text-red-500 cursor-pointer"
                            onClick={() =>
                              setDeleteConfig({
                                open: true,
                                type: "question",
                                sectionId: section.id,
                                questionId: q.id,
                              })
                            }
                          />
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={q.question}
                        onChange={(e) =>
                          setExam((prev) => ({
                            ...prev,
                            sections: prev.sections.map((s) =>
                              s.id === section.id
                                ? {
                                    ...s,
                                    questions: s.questions.map((qq) =>
                                      qq.id === q.id
                                        ? {
                                            ...qq,
                                            question: e.target.value,
                                          }
                                        : qq
                                    ),
                                  }
                                : s
                            ),
                          }))
                        }
                        className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm mb-4"
                      />

                      <div className="mb-4">
                        {q.showCodeBlock ? (
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                              <div className="flex items-center gap-2 text-slate-200 text-xs font-medium uppercase tracking-wide">
                                <Code2 size={14} />
                                Code Block
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={q.codeLanguage || "javascript"}
                                  onChange={(e) =>
                                    setExam((prev) => ({
                                      ...prev,
                                      sections: prev.sections.map((s) =>
                                        s.id === section.id
                                          ? {
                                              ...s,
                                              questions: s.questions.map((qq) =>
                                                qq.id === q.id
                                                  ? { ...qq, codeLanguage: e.target.value }
                                                  : qq
                                              ),
                                            }
                                          : s
                                      ),
                                    }))
                                  }
                                  className="bg-slate-800 text-slate-100 border border-slate-700 rounded-md px-2 py-1 text-xs"
                                >
                                  <option value="javascript">JavaScript</option>
                                  <option value="python">Python</option>
                                  <option value="java">Java</option>
                                  <option value="cpp">C++</option>
                                  <option value="sql">SQL</option>
                                  <option value="plaintext">Plain Text</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExam((prev) => ({
                                      ...prev,
                                      sections: prev.sections.map((s) =>
                                        s.id === section.id
                                          ? {
                                              ...s,
                                              questions: s.questions.map((qq) =>
                                                qq.id === q.id
                                                  ? { ...qq, codeSnippet: "", showCodeBlock: false }
                                                  : qq
                                              ),
                                            }
                                          : s
                                      ),
                                    }))
                                  }
                                  className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-600"
                                >
                                  <X size={12} /> Remove
                                </button>
                              </div>
                            </div>
                            <textarea
                              rows={8}
                              value={q.codeSnippet}
                              onChange={(e) =>
                                setExam((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((s) =>
                                    s.id === section.id
                                      ? {
                                          ...s,
                                          questions: s.questions.map((qq) =>
                                            qq.id === q.id
                                              ? { ...qq, codeSnippet: e.target.value }
                                              : qq
                                          ),
                                        }
                                      : s
                                  ),
                                }))
                              }
                              spellCheck={false}
                              className="w-full min-h-[180px] resize-y border-0 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none"
                              placeholder="Write the code snippet shown to candidates here..."
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setExam((prev) => ({
                                ...prev,
                                sections: prev.sections.map((s) =>
                                  s.id === section.id
                                    ? {
                                        ...s,
                                        questions: s.questions.map((qq) =>
                                          qq.id === q.id
                                            ? {
                                                ...qq,
                                                showCodeBlock: true,
                                                codeSnippet: qq.codeSnippet || "",
                                                codeLanguage: qq.codeLanguage || "javascript",
                                              }
                                            : qq
                                        ),
                                      }
                                    : s
                                ),
                              }))
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                          >
                            <Code2 size={15} /> Add Code Block
                          </button>
                        )}
                      </div>

                      {/* OPTIONS */}
                      <div className="grid grid-cols-2 gap-3">
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setExam((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((s) =>
                                    s.id === section.id
                                      ? {
                                          ...s,
                                          questions: s.questions.map((qq) =>
                                            qq.id === q.id
                                              ? {
                                                  ...qq,
                                                  correctAnswer: i,
                                                }
                                              : qq
                                          ),
                                        }
                                      : s
                                  ),
                                }))
                              }
                              className={`w-8 h-8 rounded-full text-xs font-semibold ${
                                q.correctAnswer === i
                                  ? "bg-green-500 text-white"
                                  : "border border-gray-300 text-gray-500"
                              }`}
                            >
                              {String.fromCharCode(65 + i)}
                            </button>

                            <input
                              value={opt}
                              onChange={(e) =>
                                setExam((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((s) =>
                                    s.id === section.id
                                      ? {
                                          ...s,
                                          questions: s.questions.map((qq) =>
                                            qq.id === q.id
                                              ? {
                                                  ...qq,
                                                  options: qq.options.map(
                                                    (o, idx) =>
                                                      idx === i
                                                        ? e.target.value
                                                        : o
                                                  ),
                                                }
                                              : qq
                                          ),
                                        }
                                      : s
                                  ),
                                }))
                              }
                              className="flex-1 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div
                    onClick={() =>
                      setExam((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s) =>
                          s.id === section.id
                            ? {
                                ...s,
                                questions: [
                                  ...s.questions,
                                  defaultQuestion(),
                                ],
                              }
                            : s
                        ),
                      }))
                    }
                    className="border-2 border-dashed border-gray-300 rounded-lg py-2 text-center text-sm cursor-pointer hover:bg-gray-100"
                  >
                    + Add Question
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {/* ADD SECTION */}
        <div
          onClick={() =>
            setExam((prev) => ({
              ...prev,
              sections: [...prev.sections, defaultSection()],
            }))
          }
          className="border-2 border-dashed border-gray-300 rounded-xl py-4 text-center text-sm cursor-pointer hover:bg-gray-100"
        >
          + Add Section
        </div>

        {/* CONFIRM DELETE */}
        <ConfirmDeleteDialog
          open={deleteConfig.open}
          onClose={() =>
            setDeleteConfig({
              open: false,
              type: null,
              sectionId: null,
              questionId: null,
            })
          }
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
}

/* ================= CONFIRM DELETE WITH OUTSIDE CLICK ================= */

function ConfirmDeleteDialog({ open, onClose, onConfirm }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Are you sure?
        </h2>

        <p className="text-sm text-gray-500 text-center mb-6">
          This action cannot be undone.
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}