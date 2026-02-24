import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function AddUserModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Recruiter",
    active: true,
  });

  useEffect(() => {
  if (!isOpen) {
    setFormData({
      name: "",
      email: "",
      role: "Recruiter",
      active: true,
    });
  }
}, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.name || !formData.email) return;
    onSave(formData);
    setFormData({
      name: "",
      email: "",
      role: "Recruiter",
      active: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm text-left flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white w-110 rounded-2xl border border-gray-200 shadow-xl" onClick={(e) => e.stopPropagation()} >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Add user
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Make changes to user details here. Click save when you're done.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option>HR Manager</option>
              <option>Recruiter</option>
              <option>HR Executive</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-medium cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}