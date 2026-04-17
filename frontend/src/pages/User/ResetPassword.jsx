import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { authAPI } from "../../utils/api";

const getPasswordChecks = (password) => ({
  minLength: password.length >= 8,
  hasUpperCase: /[A-Z]/.test(password),
  hasLowerCase: /[a-z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSpecial: /[^A-Za-z0-9]/.test(password),
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = (searchParams.get("token") || "").trim();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);
  const isStrongPassword = Object.values(checks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    if (!isStrongPassword) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Confirm password is required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Both passwords must match.");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetUserPassword(token, newPassword, confirmPassword);
      setSuccess(
        response?.message ||
          "Password reset successful. You can now login with your new password."
      );

      setTimeout(() => {
        navigate("/user-login", { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pt-20 px-6">
      <div className="w-full max-w-md text-left">
        <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
        <p className="mt-2 text-gray-500">Enter your new password below.</p>

        {error && (
          <div className="flex items-start gap-2 mt-6 bg-red-100 border border-red-300 text-red-600 px-4 py-3 rounded-md text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 mt-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-md text-sm">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 bg-white pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-gray-600">
              <span className={checks.minLength ? "text-green-600" : "text-gray-500"}>At least 8 characters</span>
              <span className={checks.hasUpperCase ? "text-green-600" : "text-gray-500"}>At least one uppercase letter</span>
              <span className={checks.hasLowerCase ? "text-green-600" : "text-gray-500"}>At least one lowercase letter</span>
              <span className={checks.hasNumber ? "text-green-600" : "text-gray-500"}>At least one number</span>
              <span className={checks.hasSpecial ? "text-green-600" : "text-gray-500"}>At least one special character</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 bg-white pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md bg-linear-to-r from-blue-600 to-blue-700 text-white font-medium hover:opacity-95 transition disabled:opacity-60"
          >
            {loading ? "Resetting password..." : "Reset Password"}
          </button>
        </form>

        <p className="mt-8 text-sm text-center text-gray-500">
          Back to{" "}
          <Link to="/user-login" className="text-blue-600 font-medium hover:underline">
            Candidate Login
          </Link>
        </p>
      </div>
    </div>
  );
}
