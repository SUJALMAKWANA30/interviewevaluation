import { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function AddUserModal({
  isOpen,
  onClose,
  onSave,
  roles = [],
  editingUser = null,
}) {
  const defaultRole = roles.find((r) => r.level === 3)?._id || "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: defaultRole,
    maxCandidateLoad: 30,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && editingUser) {
      setFormData({
        name: editingUser.name || "",
        email: editingUser.email || "",
        password: "",
        role: editingUser.role?._id || editingUser.role || defaultRole,
        maxCandidateLoad: editingUser.maxCandidateLoad || 30,
      });
    } else if (isOpen) {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: defaultRole,
        maxCandidateLoad: 30,
      });
    }
  }, [isOpen, editingUser, defaultRole]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error("Password is required.");
      return;
    }
    if (formData.password && formData.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!formData.role) {
      toast.error("Please select a role.");
      return;
    }

    setSaving(true);
    // Map frontend field names to what the backend expects
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      roleId: formData.role,
      maxCandidateLoad: formData.maxCandidateLoad,
    };
    if (formData.password) {
      payload.password = formData.password;
    }
    await onSave(payload);
    setSaving(false);
  };

  // Filter out Super Admin role (level 0) from selectable roles
  const selectableRoles = roles.filter((r) => r.level > 0);

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm text-left flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-110 rounded-2xl border border-gray-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {editingUser ? "Edit User" : "Add User"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {editingUser
                ? "Update the user details below."
                : "Fill in user details. Click save when you're done."}
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
              placeholder="Full name"
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
              placeholder="user@company.com"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password{editingUser && " (leave blank to keep current)"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={editingUser ? "••••••••" : "Min 8 characters"}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
              <option value="">Select a role</option>
              {selectableRoles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} (Level {r.level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Candidate Load
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={formData.maxCandidateLoad}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxCandidateLoad: Number(e.target.value),
                })
              }
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
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
            disabled={saving}
            className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-medium cursor-pointer disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingUser
                ? "Update User"
                : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}