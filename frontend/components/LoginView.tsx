"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useSearchParams } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Utensils, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/branding";

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const isRegistered = searchParams.get("registered");
    const regEmail = searchParams.get("email");
    if (isRegistered === "true") {
      setSuccessMsg("Registration successful! Please enter your password to sign in.");
      if (regEmail) setEmail(regEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      setSuccessMsg(`Authenticated! Loading portal...`);
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.toLowerCase().includes("wrong") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("password") ||
        msg.toLowerCase().includes("credentials") ||
        msg.toLowerCase().includes("401")
      ) {
        
        setError("Wrong email or password. Please try again.");
      } else {
        setError(msg || "Wrong email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#397765] text-white shadow-xl mb-3 ring-4 ring-amber-400/20">
            <Utensils className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight drop-shadow-sm">
            {BRAND_NAME} Staff Portal
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Sign in to access your portal
          </p>
        </div>

        {/* Card */}
        <div className="light-card p-6 sm:p-8 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-amber-500/25 dark:border-amber-400/20 shadow-2xl rounded-3xl transition-all">
          {/* Alert notifications */}
          {error && (
            <div
              className="alert alert-danger mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3.5 text-sm font-semibold text-red-700 dark:text-red-400 shadow-sm transition-all animate-in fade-in"
              id="login-error"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              className="alert alert-success mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm"
              id="login-success"
              role="status"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="input-group">
              <label className="input-label dark:text-slate-400" htmlFor="login-email">
                Email Address
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  className="custom-input pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label dark:text-slate-400" htmlFor="login-password">
                <span>Password</span>
                {password.length > 0 && (
                  <span className={`text-[11px] font-semibold ml-2 ${password.length >= 6 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                    {password.length >= 6 ? "Valid 6 characters" : "Min 6 characters"}
                  </span>
                )}
              </label>
              <div className="input-wrapper">
                <span className="input-icon-left text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="custom-input pl-10 pr-10 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-icon-right text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-xl font-bold text-white transition shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to Register */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold hover:underline">
                Create Staff Account
              </Link>
            </p>
          </div>
        </div>

        {/* Link to public customer menu */}
        <div className="mt-4 text-center">
          <Link
            href="/customer/menu"
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            ← View Digital Customer Menu (No Login Required)
          </Link>
        </div>
      </div>
    </div>
  );
};
