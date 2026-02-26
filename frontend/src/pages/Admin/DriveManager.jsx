import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Edit,
  Power,
  PowerOff,
  Loader2,
  Calendar,
  X,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { driveAPI } from "../../utils/apiClient";

export default function DriveManager() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    date: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDrives = async () => {
    try {
      const res = await driveAPI.getAll();
      setDrives(res.data || []);
    } catch {
      toast.error("Failed to fetch drives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", location: "", description: "", date: "" });
    setEditingDrive(null);
    setShowCreateModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.error("Name and location are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        date: formData.date || null,
      };

      const res = editingDrive
        ? await driveAPI.update(editingDrive._id, payload)
        : await driveAPI.create(payload);

      if (res.success) {
        toast.success(
          editingDrive
            ? "Drive updated successfully"
            : "Drive created successfully",
        );
        resetForm();
        fetchDrives();
      } else {
        toast.error(res.message || "Failed to save drive");
      }
    } catch (err) {
      toast.error(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (drive) => {
    try {
      const res = await driveAPI.toggleStatus(drive._id);
      toast.success(
        res.data.isActive ? "Drive activated" : "Drive deactivated",
      );
      fetchDrives();
    } catch {
      toast.error("Failed to toggle drive status");
    }
  };

  const handleDelete = async (drive) => {
    if (!confirm(`Are you sure you want to delete "${drive.name}"?`)) return;

    try {
      await driveAPI.delete(drive._id);
      toast.success("Drive deleted");
      fetchDrives();
    } catch {
      toast.error("Failed to delete drive");
    }
  };

  const openEditModal = (drive) => {
    setEditingDrive(drive);
    setFormData({
      name: drive.name,
      location: drive.location,
      description: drive.description || "",
      date: drive.date ? new Date(drive.date).toISOString().split("T")[0] : "",
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="w-full text-left animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded-md"></div>
            <div className="mt-2 h-4 w-72 bg-gray-100 rounded-md"></div>
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
        </div>

        {/* Drive Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              {/* Status + Actions */}
              <div className="flex items-start justify-between mb-4">
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                </div>
              </div>

              {/* Title */}
              <div className="h-5 w-40 bg-gray-300 rounded mb-3"></div>

              {/* Location */}
              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>

              {/* Date */}
              <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>

              {/* Description */}
              <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-100 rounded mb-4"></div>

              {/* Footer */}
              <div className="h-3 w-24 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-left">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Walk-in Drives
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage walk-in interview drives across locations.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Drive
        </button>
      </div>

      {/* Drives Grid */}
      {drives.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <MapPin className="h-12 w-12 mb-3" />
          <p className="text-lg font-medium">No drives created yet</p>
          <p className="text-sm mt-1">
            Create your first walk-in drive to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {drives.map((drive) => (
            <div
              key={drive._id}
              className={`rounded-xl border bg-white p-6 transition-all duration-200 hover:shadow-md ${
                drive.isActive
                  ? "border-green-200 ring-1 ring-green-100"
                  : "border-gray-200 opacity-75"
              }`}
            >
              {/* Status Badge */}
              <div className="flex items-start justify-between mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    drive.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      drive.isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  {drive.isActive ? "Active" : "Inactive"}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(drive)}
                    title={drive.isActive ? "Deactivate" : "Activate"}
                    className={`rounded-lg p-2 transition-colors ${
                      drive.isActive
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    {drive.isActive ? (
                      <Power className="h-4 w-4" />
                    ) : (
                      <PowerOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(drive)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(drive)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Drive Info */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {drive.name}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                <MapPin className="h-3.5 w-3.5" />
                {drive.location}
              </div>
              {drive.date && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(drive.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}
              {drive.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {drive.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                Created{" "}
                {new Date(drive.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingDrive ? "Edit Drive" : "Create New Drive"}
              </h2>
              <button
                onClick={resetForm}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Drive Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Vadodara Walk-in Feb 2026"
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Vadodara"
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Brief description of the drive..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 h-11 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-11 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {editingDrive ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
