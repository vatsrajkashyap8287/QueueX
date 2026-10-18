import {
  LayoutDashboard,
  ListOrdered,
  BarChart3,
  Zap,
  X,
  Sparkles,
  Activity,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function Sidebar({
  isOpen = false,
  onClose = () => {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}

      <aside
        id="queuex-mobile-sidebar"
        aria-label="Dashboard navigation"
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[270px] max-w-[85vw] flex-col
          border-r border-white/5
          bg-[#0b1122]
          shadow-2xl shadow-black/40
          transition-transform duration-300
          md:sticky md:top-0 md:z-10
          md:h-screen md:shrink-0
          md:translate-x-0
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* BRAND */}

        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/5 px-6">

          <div className="flex items-center gap-3">

            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 shadow-lg shadow-indigo-500/25">

              <Zap
                size={23}
                className="fill-white text-white"
              />

              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0b1122] bg-emerald-400" />

            </div>

            <div>
              <h1 className="text-[25px] font-extrabold tracking-tight text-white">
                Queue
                <span className="qx-gradient-text">
                  X
                </span>
              </h1>

              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Smart Queue Platform
              </p>
            </div>

          </div>

          {/* MOBILE CLOSE */}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close navigation menu"
          >
            <X size={21} />
          </button>

        </div>

        {/* NAVIGATION */}

        <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-7">

          <p className="mb-4 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
            Workspace
          </p>

          <div className="space-y-2">

            {menuItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                location.pathname === item.path;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() =>
                    handleNavigate(item.path)
                  }
                  aria-current={
                    isActive ? "page" : undefined
                  }
                  className={`
                    group flex w-full items-center gap-3
                    rounded-2xl px-4 py-3.5
                    text-left text-sm font-semibold
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >

                  <Icon
                    size={19}
                    className="shrink-0"
                  />

                  <span className="flex-1">
                    {item.name}
                  </span>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}

                </button>
              );
            })}

          </div>

          {/* PLATFORM FEATURES */}

          <div className="mt-9">

            <p className="mb-4 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
              Your Platform
            </p>

            <div className="space-y-1">

              <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400">
                <Activity
                  size={18}
                  className="text-cyan-400"
                />

                Live Queue Tracking
              </div>

              <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400">
                {isAdmin ? (
                  <BarChart3
                    size={18}
                    className="text-violet-400"
                  />
                ) : (
                  <ListOrdered
                    size={18}
                    className="text-violet-400"
                  />
                )}

                {isAdmin
                  ? "Queue Analytics"
                  : "My Queue Tokens"}
              </div>

              <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400">
                <ShieldCheck
                  size={18}
                  className="text-emerald-400"
                />

                Secure Access
              </div>

            </div>

          </div>

          {/* BRAND CARD */}

          <div className="relative mt-9 overflow-hidden rounded-2xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-cyan-500/5 p-5">

            <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-violet-500/15 blur-2xl" />

            <div className="relative">

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                <Sparkles size={20} />
              </div>

              <h3 className="text-sm font-bold text-white">
                Less Waiting.
                <br />
                More Living.
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Experience smarter queues with live tracking and seamless service.
              </p>

              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-300">
                Powered by QueueX
                <ArrowUpRight size={13} />
              </div>

            </div>

          </div>

        </nav>

        {/* BOTTOM PROFILE */}

        <div className="shrink-0 border-t border-white/5 bg-[#0a1020] p-4">

          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-semibold text-white">
                {user?.name || "User"}
              </p>

              <p className="text-xs capitalize text-slate-500">
                {user?.role || "Member"} Account
              </p>

            </div>

            <span className="qx-live-dot shrink-0" />

          </div>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;