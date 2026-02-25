import {
  Trash2,
  ChevronRight,
  Plus,
  Save,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function HiringPipeline() {
  const [rounds, setRounds] = useState([
    { id: 1, name: "Online Assessment", type: "Exam" },
    { id: 2, name: "Technical Interview", type: "Interview" },
    { id: 3, name: "HR Interview", type: "Interview" },
  ]);

  const [deleteId, setDeleteId] = useState(null);

  // ===== Confirm Delete =====
  const confirmDelete = () => {
    setRounds((prev) => prev.filter((round) => round.id !== deleteId));
    setDeleteId(null);
  };

  const closeModal = () => {
    setDeleteId(null);
  };

  // ESC key close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };
    if (deleteId) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [deleteId]);

  // ===== Move Up =====
  const moveUp = (index) => {
    if (index === 0) return;
    const updated = [...rounds];
    [updated[index - 1], updated[index]] = [
      updated[index],
      updated[index - 1],
    ];
    setRounds(updated);
  };

  // ===== Move Down =====
  const moveDown = (index) => {
    if (index === rounds.length - 1) return;
    const updated = [...rounds];
    [updated[index + 1], updated[index]] = [
      updated[index],
      updated[index + 1],
    ];
    setRounds(updated);
  };

  const handleChange = (id, field, value) => {
    setRounds((prev) =>
      prev.map((round) =>
        round.id === id ? { ...round, [field]: value } : round
      )
    );
  };

  const handleAddRound = () => {
    setRounds((prev) => [
      ...prev,
      { id: Date.now(), name: "New Round", type: "Interview" },
    ]);
  };

  const handleSave = () => {
    console.log("Saving pipeline:", rounds);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8 text-left relative">
      {/* ===== Save Button ===== */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition shadow-sm"
        >
          <Save size={16} />
          Save Pipeline
        </button>
      </div>

      {/* ===== Preview ===== */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Hiring Pipeline
        </h2>

        <div className="flex items-center gap-6 flex-wrap">
          {rounds.map((round, index) => (
            <div key={round.id} className="flex items-center gap-6">
              <div className="w-56 bg-indigo-50 border border-blue-200 rounded-xl px-5 py-4 text-center">
                <p className="text-sm font-semibold text-blue-600">
                  Step {index + 1}
                </p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {round.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {round.type}
                </p>
              </div>

              {index !== rounds.length - 1 && (
                <ChevronRight className="text-gray-400" size={18} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== Round Cards ===== */}
      <div className="space-y-5">
        {rounds.map((round, index) => (
          <div
            key={round.id}
            className="bg-white border border-gray-200 rounded-xl px-6 py-6 flex items-start justify-between"
          >
            <div className="flex gap-6 w-full">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-blue-600 font-semibold shrink-0">
                {index + 1}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Round Name
                  </label>
                  <input
                    type="text"
                    value={round.name}
                    onChange={(e) =>
                      handleChange(round.id, "name", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Type
                  </label>
                  <select
                    value={round.type}
                    onChange={(e) =>
                      handleChange(round.id, "type", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Exam">Exam</option>
                    <option value="Interview">Interview</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 ml-6 mt-1">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className={`p-1 ${
                  index === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-400 hover:text-blue-600"
                }`}
              >
                <ArrowUp size={18} />
              </button>

              <button
                onClick={() => moveDown(index)}
                disabled={index === rounds.length - 1}
                className={`p-1 ${
                  index === rounds.length - 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-400 hover:text-blue-600"
                }`}
              >
                <ArrowDown size={18} />
              </button>

              <button
                onClick={() => setDeleteId(round.id)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Add Round ===== */}
      <div className="mt-8">
        <button
          onClick={handleAddRound}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-100 transition"
        >
          <Plus size={16} />
          Add Round
        </button>
      </div>

      {/* ===== DELETE MODAL ===== */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Card */}
          <div className="relative bg-white w-100 rounded-xl shadow-xl p-8 text-center z-10">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Are you sure?
            </h3>
            <p className="text-gray-500 mb-6">
              This action cannot be undone.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}