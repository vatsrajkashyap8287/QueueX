import { Link } from "react-router-dom";

import {
  Zap,
  ShieldCheck,
  Heart,
  ArrowUpRight,
  Activity,
  Sparkles,
} from "lucide-react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-white/5 bg-[#080d1d]/80">

      <div className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8 lg:px-10">

        {/* MAIN CONTENT */}

        <div className="grid gap-10 md:grid-cols-3">

          {/* BRAND */}

          <div className="min-w-0">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                <Zap
                  size={22}
                  className="fill-white text-white"
                />
              </div>

              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-white">
                  Queue
                  <span className="qx-gradient-text">
                    X
                  </span>
                </h3>

                <p className="text-[11px] text-slate-500">
                  Smart Virtual Queue Platform
                </p>
              </div>

            </div>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Transforming the way people wait.
              Manage queues intelligently, track tokens
              in real time, and enjoy a smoother service
              experience.
            </p>

          </div>

          {/* QUICK LINKS */}

          <div>

            <h4 className="mb-5 text-sm font-bold text-white">
              Quick Navigation
            </h4>

            <div className="flex flex-col gap-4">

              <Link
                to="/dashboard"
                className="group flex w-fit items-center gap-2 text-sm text-slate-400 transition hover:text-indigo-300"
              >
                Dashboard

                <ArrowUpRight
                  size={14}
                  className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>

              <a
                href="#top"
                className="group flex w-fit items-center gap-2 text-sm text-slate-400 transition hover:text-indigo-300"
              >
                Back to Top

                <ArrowUpRight
                  size={14}
                  className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>

            </div>

          </div>

          {/* FEATURES */}

          <div>

            <h4 className="mb-5 text-sm font-bold text-white">
              Why QueueX?
            </h4>

            <div className="space-y-4">

              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Activity
                  size={17}
                  className="text-emerald-400"
                />
                Real-Time Queue Tracking
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-400">
                <ShieldCheck
                  size={17}
                  className="text-indigo-400"
                />
                Secure Queue Management
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Sparkles
                  size={17}
                  className="text-violet-400"
                />
                Smart Waiting Experience
              </div>

            </div>

          </div>

        </div>

        {/* BOTTOM */}

        <div className="mt-10 flex flex-col gap-4 border-t border-white/5 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <p>
            © {currentYear} QueueX. All rights reserved.
          </p>

          <p className="flex items-center gap-1.5">
            Crafted with
            <Heart
              size={13}
              className="fill-rose-400 text-rose-400"
            />
            for better waiting experiences.
          </p>

          <p className="font-medium text-slate-400">
            QueueX v1.0
          </p>

        </div>

      </div>

    </footer>
  );
}

export default Footer;