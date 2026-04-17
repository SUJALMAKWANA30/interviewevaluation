import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { authAPI } from "../../utils/api";
import { validateEmail } from "../../utils/validation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    setError("");
    setSuccess("");

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotUserPassword(normalizedEmail);
      setSuccess(
        response?.message ||
          "If an account exists for this email, a password reset link has been sent."
      );
    } catch (err) {
      setError(err.message || "Failed to submit forgot password request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pt-24 px-6">
      <div className="w-full max-w-md text-left">
        <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
        <p className="mt-2 text-gray-500">
          Enter your registered email and we will send you a reset link.
        </p>

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
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                className="w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md bg-linear-to-r from-blue-600 to-blue-700 text-white font-medium hover:opacity-95 transition disabled:opacity-60"
          >
            {loading ? "Sending reset link..." : "Send Reset Link"}
          </button>
        </form>

        <p className="mt-8 text-sm text-center text-gray-500">
          Remembered your password?{" "}
          <Link to="/user-login" className="text-blue-600 font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
