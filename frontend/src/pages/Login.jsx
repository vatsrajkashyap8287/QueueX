import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Ticket,
  Clock3,
  CheckCircle2,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ==========================================
// DESIGN SYSTEM
// ==========================================

const INPUT =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 focus:border-indigo-400/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d1d]";

// ==========================================
// BRAND
// ==========================================

function Brand() {
  return (
    <Link
      to="/login"
      className={`inline-flex items-center gap-3 rounded-xl ${FOCUS}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 shadow-lg shadow-indigo-500/25">
        <Zap size={25} className="fill-white text-white" />
      </div>

      <div>
        <h2 className="text-[27px] font-extrabold tracking-tight text-white">
          Queue<span className="qx-gradient-text">X</span>
        </h2>

        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Smart Queue Platform
        </p>
      </div>
    </Link>
  );
}

// ==========================================
// LOGIN
// ==========================================

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ========================================
  // HANDLE INPUT
  // ========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // ========================================
  // LOGIN REQUEST
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      login(response.data.user, response.data.token);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.userMessage ||
          err.response?.data?.message ||
          "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="relative flex min-h-screen min-w-0 items-center justify-center overflow-hidden bg-[#080d1d] px-4 py-10 text-white sm:px-6">

      {/* BACKGROUND GLOWS */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-[450px] w-[450px] rounded-full bg-indigo-600/15 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[450px] w-[450px] rounded-full bg-violet-600/15 blur-3xl" />

      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/5 blur-3xl" />

      {/* MAIN CONTAINER */}

      <main className="relative z-10 w-full max-w-[460px] min-w-0">

        {/* BRAND */}

        <div className="mb-9 flex justify-center">
          <Brand />
        </div>

        {/* WELCOME HEADER */}

        <div className="mb-8 text-center">

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300">
            <Sparkles size={15} />
            Welcome to QueueX
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Welcome back
            <span className="text-indigo-400">.</span>
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            Sign in to manage your tokens and track
            your queues in real time.
          </p>

        </div>

        {/* LOGIN CARD */}

        <div className="overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#111a30]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="flex min-w-0 items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300"
              >
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span className="min-w-0 break-words">
                  {error}
                </span>
              </div>
            )}

            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  maxLength={254}
                  disabled={loading}
                  className={INPUT}
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Password
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`${INPUT} pr-12`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={showPassword}
                  disabled={loading}
                  className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white ${FOCUS}`}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
            >

              {loading ? (
                <RefreshCw
                  size={18}
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <ArrowRight size={18} />
              )}

              {loading
                ? "Signing you in..."
                : "Sign In to QueueX"}

            </button>

          </form>

        </div>

        {/* REGISTER LINK */}

        <p className="mt-7 text-center text-sm text-slate-400">
          New to QueueX?{" "}

          <Link
            to="/register"
            className={`font-bold text-indigo-300 transition hover:text-cyan-300 ${FOCUS}`}
          >
            Create an account →
          </Link>
        </p>

        {/* SECURITY FOOTER */}

        <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck
            size={15}
            className="text-emerald-400"
          />

          Secure authentication powered by QueueX
        </div>

        {/* COPYRIGHT */}

        <p className="mt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} QueueX.
          All rights reserved.
        </p>

      </main>

    </div>
  );
}

export default Login;