"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Eye, EyeOff, ArrowRight, Utensils, CheckCircle2, AlertCircle, CreditCard, ChefHat } from "lucide-react";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/branding";

export const RegisterView: React.FC = () => {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role] = useState<"user" | "cashier" | "chef">("user");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordValid = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Please enter a valid full name.");
      return;
    }

    if (!passwordValid) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your entries.");
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password, role);
      setSuccessMsg(`Registration successful! Redirecting to login page...`);
      setTimeout(() => {
        router.push(`/login?registered=true&email=${encodeURIComponent(email.trim())}`);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-shell min-h-screen flex items-center justify-center p-4 sm:p-6 my-6 transition-colors">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#397765] text-white shadow-xl mb-3 ring-4 ring-amber-400/20">
            <Utensils className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight drop-shadow-sm">
            {BRAND_NAME} Registration
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Create your customer or staff account
          </p>
        </div>

        {/* Card */}
        <div className="light-card p-6 sm:p-8 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-amber-500/25 dark:border-amber-400/20 shadow-2xl rounded-3xl transition-all">
          {/* Alerts */}
          {error && (
            <div
              className="alert alert-danger mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-700 shadow-sm"
              id="register-error"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              className="alert alert-success mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-semibold text-emerald-700 shadow-sm"
              id="register-success"
              role="status"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="input-group">
              <label className="input-label" htmlFor="register-name">
                Full Name
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="register-name"
                  type="text"
                  className="custom-input pl-10"
                  placeholder="Gordon Ramsay"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="input-group">
              <label className="input-label" htmlFor="register-email">
                Email Address
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="register-email"
                  type="email"
                  className="custom-input pl-10"
                  placeholder="you@example.com"


                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="register-password">
                <span>Password</span>
                {password.length > 0 && (
                    <span className={`text-[11px] font-semibold ${passwordValid ? "text-emerald-600" : "text-indigo-600"}`}>
                    {passwordValid ? "Valid 6 characters" : "Min 6 characters"}

                  </span>
                )}
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  className="custom-input pl-10 pr-10"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-icon-right text-slate-400 hover:text-slate-600 transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="register-confirm-password">
                <span>Confirm Password</span>
                {confirmPassword.length > 0 && (
                  <span className={`text-[11px] font-semibold ${passwordsMatch ? "text-emerald-600" : "text-rose-600"}`}>
                    {passwordsMatch ? "✓ Passwords match" : "✗ Passwords don't match"}
                  </span>
                )}
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  className="custom-input pl-10 pr-10"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="input-icon-right text-slate-400 hover:text-slate-600 transition"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (password.length > 0 && !passwordsMatch)}
              className="w-full btn-primary py-3 rounded-xl font-bold text-white transition shadow-md flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Register as Customer & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link to Login */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline">
                Sign In Here
              </Link>
            </p>
          </div>
        </div>

        {/* Customer Menu Link */}
        <div className="mt-4 text-center">
          <Link
            href="/customer/menu"
            className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
          >
            ← View Digital Customer Menu (No Login Required)
          </Link>
        </div>
      </div>
    </div>
  );
};
