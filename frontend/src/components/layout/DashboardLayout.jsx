import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Menu,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  LogOut,
  UserRound,
  Mail,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "./Sidebar";
import Footer from "./Footer";

import { useAuth } from "../../context/AuthContext";

function DashboardLayout({ children }) {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const profileRef = useRef(null);

  const isAdmin = user?.role === "admin";

  const today = new Date().toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  );

  // ======================================
  // MOBILE SIDEBAR SCROLL LOCK
  // ======================================

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [sidebarOpen]);

  // ======================================
  // ESCAPE KEY
  // ======================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // ======================================
  // CLOSE PROFILE ON OUTSIDE CLICK
  // ======================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );
    };
  }, []);

  // ======================================
  // SIGN OUT
  // ======================================

  const handleLogout = () => {
    setProfileOpen(false);
    setSidebarOpen(false);

    logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div
      id="top"
      className="qx-background flex min-h-screen min-w-0 text-white"
    >
      {/* ==================================
          SIDEBAR
      ================================== */}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ==================================
          MAIN AREA
      ================================== */}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">

        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-white/5 bg-[#080d1d]/85 px-4 backdrop-blur-2xl sm:h-20 sm:px-6 lg:px-10">

          {/* LEFT */}

          <div className="flex min-w-0 items-center gap-4">

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 md:hidden"
              aria-label="Open navigation menu"
              aria-controls="queuex-mobile-sidebar"
              aria-expanded={sidebarOpen}
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <h2 className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
                  {isAdmin
                    ? "Admin Workspace"
                    : "My Workspace"}
                </h2>

                <Sparkles
                  size={15}
                  className="hidden text-violet-400 sm:block"
                />

              </div>

              <p className="hidden text-xs text-slate-500 sm:block">
                {today}
              </p>

            </div>

          </div>

          {/* ==================================
              RIGHT HEADER
          ================================== */}

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">

            {/* SECURITY */}

            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-400 lg:flex">
              <ShieldCheck size={15} />
              Secure Workspace
            </div>

            {/* ==================================
                PROFILE DROPDOWN
            ================================== */}

            <div
              ref={profileRef}
              className="relative"
            >

              {/* PROFILE TRIGGER */}

              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    (previous) => !previous
                  )
                }
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-controls="queuex-profile-menu"
                className={`flex items-center gap-3 rounded-2xl border px-2 py-1.5 text-left transition-all duration-200 sm:px-3 ${
                  profileOpen
                    ? "border-indigo-400/30 bg-indigo-500/10"
                    : "border-white/10 bg-white/5 hover:border-indigo-400/20 hover:bg-white/10"
                }`}
              >

                {/* AVATAR */}

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 sm:h-10 sm:w-10">
                  {user?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>

                {/* USER INFO */}

                <div className="hidden min-w-0 sm:block">

                  <p className="max-w-32 truncate text-sm font-semibold text-white">
                    {user?.name || "User"}
                  </p>

                  <p className="text-xs capitalize text-slate-400">
                    {user?.role || "Member"}
                  </p>

                </div>

                {/* DROPDOWN ICON */}

                <ChevronDown
                  size={16}
                  className={`hidden text-slate-400 transition-transform duration-200 sm:block ${
                    profileOpen
                      ? "rotate-180 text-indigo-300"
                      : ""
                  }`}
                />

              </button>

              {/* ==================================
                  DROPDOWN MENU
              ================================== */}

              {profileOpen && (
                <div
                  id="queuex-profile-menu"
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-3 w-[min(300px,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-white/10 bg-[#111a30] p-2 shadow-2xl shadow-black/50"
                >

                  {/* PROFILE DETAILS */}

                  <div className="rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 p-4">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
                        {user?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-bold text-white">
                          {user?.name || "User"}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-xs capitalize text-indigo-300">
                          <UserRound size={13} />
                          {user?.role || "Member"} Account
                        </p>

                      </div>

                    </div>

                    {/* EMAIL */}

                    {user?.email && (
                      <div className="mt-4 flex min-w-0 items-center gap-2 border-t border-white/10 pt-3 text-xs text-slate-400">

                        <Mail
                          size={14}
                          className="shrink-0"
                        />

                        <span className="min-w-0 truncate">
                          {user.email}
                        </span>

                      </div>
                    )}

                  </div>

                  {/* SIGN OUT */}

                  <div className="mt-2 border-t border-white/[0.06] pt-2">

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                    >
                      <LogOut size={18} />

                      <span className="flex-1">
                        Sign Out
                      </span>
                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="w-full min-w-0 flex-1 overflow-x-clip px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">

          <div className="qx-fade-up mx-auto w-full min-w-0 max-w-[1600px]">
            {children}
          </div>

        </main>

        {/* FOOTER */}

        <Footer />

      </div>
    </div>
  );
}

export default DashboardLayout;