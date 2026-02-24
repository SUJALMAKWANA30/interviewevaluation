import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Trash2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { examAPI } from "../../utils/api";

export default function ExamsList() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("cards");
  const [search, setSearch] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  // Fetch exams from DB
  const fetchExams = async () => {
    try {
      const res = await examAPI.getAllExams();
      if (res.success) {
        setExams(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch exams:", err);
      toast.error("Failed to load exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Toggle active status
  const handleToggleActive = async (e, examId) => {
    e.stopPropagation();
    setTogglingId(examId);
    try {
      const res = await examAPI.toggleActive(examId);
      if (res.success) {
        toast.success(res.message);
        // Update local state
        setExams((prev) =>
          prev.map((ex) => ({
            ...ex,
            isActive: ex._id === examId ? res.data.isActive : false,
            status: ex._id === examId && res.data.isActive ? "Published" : ex._id === examId ? ex.status : ex.isActive ? "Draft" : ex.status,
          }))
        );
      }
    } catch (err) {
      toast.error("Failed to toggle exam status.");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete exam
  const handleDeleteExam = async (e, examId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this exam?")) return;
    try {
      const res = await examAPI.deleteExam(examId);
      if (res.success) {
        toast.success("Exam deleted.");
        setExams((prev) => prev.filter((ex) => ex._id !== examId));
      }
    } catch (err) {
      toast.error("Failed to delete exam.");
    }
  };

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(search.toLowerCase())
  );

  const getSectionCount = (exam) =>
    Array.isArray(exam.sections) ? exam.sections.length : 0;

  const getQuestionCount = (exam) =>
    Array.isArray(exam.sections)
      ? exam.sections.reduce(
          (acc, sec) =>
            acc + (Array.isArray(sec.questions) ? sec.questions.length : 0),
          0
        )
      : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-left bg-[#f8fafc] p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Exams
            </h1>
            <p className="text-sm text-gray-500">
              Manage and create assessment exams
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/hr/exams/create")}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 cursor-pointer"
            >
              <Plus size={16} />
              Create Exam
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex justify-between items-center">
          {/* Search */}
          <div className="relative w-72">
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-gray-400"
            />
            <input
              placeholder="Search exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 rounded-lg pl-9 pr-3 py-2 text-sm"
            />
          </div>

          {/* View Toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-4 py-2 text-sm flex items-center gap-2 ${
                viewMode === "cards"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              <LayoutGrid size={16} />
              Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 text-sm flex items-center gap-2 ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              <List size={16} />
              Table
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredExams.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-3">
              No exams found.
            </p>
            <button
              onClick={() => navigate("/hr/exams/create")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Create Your First Exam
            </button>
          </div>
        ) : viewMode === "cards" ? (
          /* Cards View */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition relative"
              >
                {/* Card content - clickable area */}
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(`/hr/exams/${exam._id}/builder`)
                  }
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900 pr-2">
                      {exam.title}
                    </h3>

                    <span
                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                        exam.isActive
                          ? "bg-green-100 text-green-700"
                          : exam.status === "Published"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {exam.isActive ? "Active" : exam.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-3">
                    Created: {formatDate(exam.createdAt)}
                  </p>

                  <div className="text-xs text-gray-600 flex justify-between mb-4">
                    <span>{getSectionCount(exam)} Sections</span>
                    <span>{getQuestionCount(exam)} Questions</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => handleToggleActive(e, exam._id)}
                    disabled={togglingId === exam._id}
                    className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer ${
                      exam.isActive
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } disabled:opacity-50`}
                  >
                    {togglingId === exam._id
                      ? "..."
                      : exam.isActive
                      ? "Active ✓"
                      : "Set Active"}
                  </button>

                  <button
                    onClick={(e) => handleDeleteExam(e, exam._id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-6 py-3">Title</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Sections</th>
                  <th className="text-left px-6 py-3">Questions</th>
                  <th className="text-left px-6 py-3">Created</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr
                    key={exam._id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() =>
                        navigate(`/hr/exams/${exam._id}/builder`)
                      }
                    >
                      {exam.title}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          exam.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {exam.isActive ? "Active" : exam.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getSectionCount(exam)}</td>
                    <td className="px-6 py-4">{getQuestionCount(exam)}</td>
                    <td className="px-6 py-4">{formatDate(exam.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleToggleActive(e, exam._id)}
                          disabled={togglingId === exam._id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            exam.isActive
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          } disabled:opacity-50`}
                        >
                          {togglingId === exam._id
                            ? "..."
                            : exam.isActive
                            ? "Active ✓"
                            : "Set Active"}
                        </button>
                        <button
                          onClick={(e) => handleDeleteExam(e, exam._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
