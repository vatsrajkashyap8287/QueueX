import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import toast from "react-hot-toast";

import {
  Ticket,
  Clock,
  ListOrdered,
  Bell,
  RefreshCw,
  History,
  CheckCircle,
  XCircle,
  Timer,
  MapPin,
  PlayCircle,
  Volume2,
  VolumeX,
  CalendarDays,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Zap,
  Activity,
  ShieldCheck,
  ChevronRight,
  Radio,
  Hourglass,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";
import StatCard from "../components/dashboard/StatCard";
import ConnectionStatus from "../components/dashboard/ConnectionStatus";
import ConfirmModal from "../components/common/ConfirmModal";

import YourTurnAlert, {
  playNotificationSound,
} from "../components/dashboard/YourTurnAlert";

import LiveWaitingCountdown from "../components/dashboard/LiveWaitingCountdown";

import api from "../services/api";
import { connectSocket } from "../services/socket";

import {
  getNotificationPermission,
  requestNotificationPermission,
  showYourTurnNotification,
} from "../services/notification";

// ==========================================
// DESIGN SYSTEM
// ==========================================

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d1d]";

const BUTTON =
  `inline-flex min-w-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;

const PRIMARY_BUTTON =
  `${BUTTON} bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 enabled:hover:brightness-110 enabled:hover:shadow-indigo-500/30`;

const SECONDARY_BUTTON =
  `${BUTTON} border border-white/10 bg-white/[0.05] text-slate-200 enabled:hover:border-indigo-400/30 enabled:hover:bg-white/10`;

const CARD =
  "min-w-0 overflow-hidden rounded-[24px] border border-white/[0.08] bg-gradient-to-br from-[#17223b] to-[#10182c] shadow-xl shadow-black/10";

const STAT_GRID =
  "grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";

// ==========================================
// HELPERS
// ==========================================

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMinutes = (minutes) => {
  if (minutes === null || minutes === undefined) {
    return "—";
  }

  return `${minutes} min`;
};

const getErrorMessage = (err, fallback) => {
  return (
    err?.userMessage ||
    err?.response?.data?.message ||
    fallback
  );
};

// ==========================================
// STATUS CONFIGURATION
// ==========================================

const STATUS_META = {
  waiting: {
    label: "Waiting",
    badge:
      "border-amber-400/20 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
  },

  serving: {
    label: "Your Turn",
    badge:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
  },

  completed: {
    label: "Completed",
    badge:
      "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    dot: "bg-cyan-400",
  },

  cancelled: {
    label: "Cancelled",
    badge:
      "border-rose-400/20 bg-rose-400/10 text-rose-300",
    dot: "bg-rose-400",
  },

  active: {
    label: "Active",
    badge:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
  },

  paused: {
    label: "Paused",
    badge:
      "border-amber-400/20 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
  },
};

const FALLBACK_STATUS = {
  label: "Unknown",
  badge:
    "border-slate-400/20 bg-slate-400/10 text-slate-300",
  dot: "bg-slate-400",
};

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({ status, label }) {
  const meta = STATUS_META[status] || FALLBACK_STATUS;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${meta.badge}`}
    >
      <span className="relative flex h-2 w-2">
        {(status === "active" ||
          status === "serving") && (
          <span
            className={`absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:animate-none ${meta.dot}`}
          />
        )}

        <span
          className={`relative h-2 w-2 rounded-full ${meta.dot}`}
        />
      </span>

      {label || meta.label}
    </span>
  );
}

// ==========================================
// SECTION HEADER
// ==========================================

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  action,
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/15 bg-indigo-500/10 text-indigo-300">
          <Icon size={22} />
        </div>

        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-400">
              {eyebrow}
            </p>
          )}

          <h2 className="break-words text-xl font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            {subtitle}
          </p>
        </div>

      </div>

      {action}
    </div>
  );
}

// ==========================================
// ERROR ALERT
// ==========================================

function ErrorAlert({ message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex min-w-0 items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300"
    >
      <AlertTriangle
        size={19}
        className="mt-0.5 shrink-0"
      />

      <span className="min-w-0 break-words">
        {message}
      </span>
    </div>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className={`${CARD} px-5 py-12 text-center sm:py-16`}>

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-indigo-400/15 bg-indigo-500/10 text-indigo-300">
        <Icon size={29} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-400">
        {description}
      </p>

    </div>
  );
}

// ==========================================
// PREMIUM TOKEN TICKET
// ==========================================

function TokenTicket({ entry }) {
  const serving = entry.status === "serving";

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-[20px] border ${
        serving
          ? "border-emerald-400/25 bg-gradient-to-r from-emerald-500/15 to-teal-500/5"
          : "border-indigo-400/25 bg-gradient-to-r from-indigo-500/20 via-violet-500/10 to-cyan-500/5"
      }`}
    >
      <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="relative flex min-w-0">

        {/* TICKET NUMBER */}

        <div className="relative flex w-[112px] shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-white/15 px-3 py-6 sm:w-[145px]">

          <Ticket
            size={18}
            className={
              serving
                ? "text-emerald-300"
                : "text-indigo-300"
            }
          />

          <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            My Token
          </span>

          <span
            className={`mt-2 max-w-full break-all text-center text-4xl font-black tracking-tight sm:text-5xl ${
              serving
                ? "text-emerald-300"
                : "text-white"
            }`}
          >
            {entry.tokenNumber}
          </span>

          <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#17223b]" />
          <span className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-[#17223b]" />

        </div>

        {/* TICKET DETAILS */}

        <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Queue Details
          </p>

          <h3 className="mt-2 break-words text-base font-bold text-white sm:text-xl">
            {entry.queue?.name || "Queue"}
          </h3>

          <div className="mt-4">
            <StatusBadge status={entry.status} />
          </div>

        </div>

      </div>
    </div>
  );
}

// ==========================================
// PREMIUM HISTORY MOBILE CARD
// ==========================================

function MobileHistoryCard({ entry }) {
  const completed = entry.status === "completed";

  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#111a2f] p-4">

      <div className="flex flex-wrap items-start justify-between gap-3">

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <MapPin size={14} />
            Queue
          </p>

          <h3 className="mt-1 break-words text-base font-bold text-white">
            {entry.queue?.name || "Deleted Queue"}
          </h3>
        </div>

        <StatusBadge status={entry.status} />

      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-indigo-400/10 bg-indigo-500/10 p-3">

        <Ticket
          size={20}
          className="text-indigo-300"
        />

        <span className="text-lg font-extrabold text-white">
          Token #{entry.tokenNumber}
        </span>

      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div className="min-w-0 rounded-xl bg-white/[0.04] p-3">
          <p className="text-xs text-slate-400">
            Waiting Time
          </p>

          <p className="mt-2 break-words font-bold text-white">
            {formatMinutes(entry.waitingTime)}
          </p>
        </div>

        <div className="min-w-0 rounded-xl bg-white/[0.04] p-3">
          <p className="text-xs text-slate-400">
            Service Duration
          </p>

          <p className="mt-2 break-words font-bold text-white">
            {formatMinutes(entry.serviceDuration)}
          </p>
        </div>

      </div>

      <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">

        <p className="flex items-center gap-2 text-xs text-slate-400">
          <CalendarDays size={14} />
          Joined: {formatDate(entry.joinedAt)}
        </p>

        <p
          className={`flex items-center gap-2 text-xs ${
            completed
              ? "text-emerald-300"
              : "text-rose-300"
          }`}
        >
          {completed ? (
            <CheckCircle size={14} />
          ) : (
            <XCircle size={14} />
          )}

          {completed
            ? `Completed: ${formatDate(entry.completedAt)}`
            : "Queue Left / Cancelled"}
        </p>

      </div>

    </div>
  );
}

// ==========================================
// USER DASHBOARD
// ==========================================

function UserDashboard() {
  const [queues, setQueues] = useState([]);
  const [myEntries, setMyEntries] = useState([]);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [historyError, setHistoryError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(null);

  // ========================================
  // LEAVE CONFIRMATION
  // ========================================

  const [
    pendingLeaveEntryId,
    setPendingLeaveEntryId,
  ] = useState(null);

  const leaveRequestInProgressRef = useRef(false);

  // ========================================
  // NOTIFICATIONS
  // ========================================

  const [
    notificationPermission,
    setNotificationPermission,
  ] = useState(getNotificationPermission());

  const notifiedTokensRef = useRef(new Set());

  const notificationInitializedRef = useRef(false);

  const [dismissedAlerts, setDismissedAlerts] =
    useState(() => new Set());

  const [soundEnabled, setSoundEnabled] =
    useState(() => {
      return (
        localStorage.getItem(
          "queuex_sound_enabled"
        ) === "true"
      );
    });

  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;

    localStorage.setItem(
      "queuex_sound_enabled",
      String(soundEnabled)
    );
  }, [soundEnabled]);

  // ========================================
  // FETCH DASHBOARD DATA
  // ========================================

  const fetchData = useCallback(async () => {
    try {
      const [
        queuesResponse,
        myQueuesResponse,
      ] = await Promise.all([
        api.get("/queues"),
        api.get("/queues/my"),
      ]);

      const availableQueues =
        queuesResponse.data.queues || [];

      const activeEntries =
        myQueuesResponse.data.entries || [];

      setQueues(availableQueues);
      setMyEntries(activeEntries);
      setError("");

      const servingEntries =
        activeEntries.filter(
          (entry) => entry.status === "serving"
        );

      if (!notificationInitializedRef.current) {
        servingEntries.forEach((entry) => {
          notifiedTokensRef.current.add(entry._id);
        });

        notificationInitializedRef.current = true;
      } else {
        servingEntries.forEach((entry) => {
          if (
            notifiedTokensRef.current.has(entry._id)
          ) {
            return;
          }

          notifiedTokensRef.current.add(entry._id);

          showYourTurnNotification({
            queueName:
              entry.queue?.name || "Your Queue",
            tokenNumber: entry.tokenNumber,
          });

          if (soundEnabledRef.current) {
            playNotificationSound();
          }
        });
      }
    } catch (err) {
      console.error(
        "Dashboard fetch error:",
        err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to load dashboard data."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================
  // FETCH HISTORY
  // ========================================

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get(
        "/queues/history"
      );

      setHistory(
        response.data.entries || []
      );

      setHistoryError("");
    } catch (err) {
      console.error(
        "History fetch error:",
        err
      );

      setHistoryError(
        getErrorMessage(
          err,
          "Failed to load queue history."
        )
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(
    async () => {
      await Promise.all([
        fetchData(),
        fetchHistory(),
      ]);
    },
    [fetchData, fetchHistory]
  );

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // ========================================
  // SOCKET.IO
  // ========================================

  useEffect(() => {
    const socket = connectSocket();

    if (!socket) {
      console.warn(
        "Socket unavailable: authentication token missing"
      );

      return;
    }

    const handleConnect = () => {
      refreshDashboard();
    };

    const handleQueueUpdate = () => {
      refreshDashboard();
    };

    socket.on("connect", handleConnect);

    socket.on(
      "queue_updated",
      handleQueueUpdate
    );

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "queue_updated",
        handleQueueUpdate
      );
    };
  }, [refreshDashboard]);

  // ========================================
  // NOTIFICATION CONTROLS
  // ========================================

  const enableNotifications = async () => {
    try {
      const permission =
        await requestNotificationPermission();

      setNotificationPermission(permission);

      if (permission === "granted") {
        toast.success(
          "QueueX browser notifications enabled!"
        );
      } else if (permission === "denied") {
        toast.error(
          "Notifications are blocked. Enable them from browser settings."
        );
      } else {
        toast(
          "Notification permission was not granted."
        );
      }
    } catch (err) {
      console.error(
        "Notification permission error:",
        err
      );

      toast.error(
        "Unable to enable browser notifications."
      );
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;

    setSoundEnabled(newValue);

    if (newValue) {
      playNotificationSound();

      toast.success(
        "Notification sound enabled!"
      );
    } else {
      toast(
        "Notification sound disabled.",
        { icon: "🔇" }
      );
    }
  };

  const dismissAlert = (entryId) => {
    setDismissedAlerts((previous) => {
      const updated = new Set(previous);

      updated.add(entryId);

      return updated;
    });
  };

  // ========================================
  // JOIN QUEUE
  // ========================================

  const joinQueue = async (queueId) => {
    if (
      actionLoading ||
      pendingLeaveEntryId
    ) {
      return;
    }

    const selectedQueue = queues.find(
      (queue) => queue._id === queueId
    );

    const toastId = toast.loading(
      "Joining queue..."
    );

    try {
      setActionLoading(
        `join-${queueId}`
      );

      await api.post(
        `/queues/${queueId}/join`
      );

      toast.success(
        `Joined "${selectedQueue?.name || "Queue"}" successfully!`,
        { id: toastId }
      );

      await refreshDashboard();
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to join queue."
        ),
        { id: toastId }
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================
  // LEAVE QUEUE
  // ========================================

  const leaveQueue = (entryId) => {
    if (
      actionLoading ||
      pendingLeaveEntryId ||
      leaveRequestInProgressRef.current
    ) {
      return;
    }

    setPendingLeaveEntryId(entryId);
  };

  const cancelLeaveQueue =
    useCallback(() => {
      if (
        leaveRequestInProgressRef.current
      ) {
        return;
      }

      setPendingLeaveEntryId(null);
    }, []);

  const confirmLeaveQueue = async () => {
    if (
      !pendingLeaveEntryId ||
      actionLoading ||
      leaveRequestInProgressRef.current
    ) {
      return;
    }

    const entryId = pendingLeaveEntryId;

    leaveRequestInProgressRef.current =
      true;

    setActionLoading(
      `leave-${entryId}`
    );

    const toastId = toast.loading(
      "Leaving queue..."
    );

    try {
      await api.delete(
        `/queues/entries/${entryId}`
      );

      toast.success(
        "You have left the queue successfully!",
        { id: toastId }
      );

      await refreshDashboard();

      setPendingLeaveEntryId(null);
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to leave queue."
        ),
        { id: toastId }
      );
    } finally {
      leaveRequestInProgressRef.current =
        false;

      setActionLoading(null);
    }
  };

  // ========================================
  // DASHBOARD DATA
  // ========================================

  const pendingLeaveEntry = myEntries.find(
    (entry) =>
      entry._id === pendingLeaveEntryId
  );

  const leaveConfirmationMessage =
    pendingLeaveEntry
      ? `Are you sure you want to leave "${pendingLeaveEntry.queue?.name || "this queue"}"? Your Token #${pendingLeaveEntry.tokenNumber} will be cancelled and removed from the waiting queue.`
      : "Are you sure you want to leave this queue? Your waiting token will be cancelled.";

  const activeTokens = myEntries.length;

  const waitingTokens = myEntries.filter(
    (entry) =>
      entry.status === "waiting"
  ).length;

  const servingNow = myEntries.filter(
    (entry) =>
      entry.status === "serving"
  ).length;

  const completedServices =
    history.filter(
      (entry) =>
        entry.status === "completed"
    ).length;

  const servingEntries = myEntries.filter(
    (entry) =>
      entry.status === "serving" &&
      !dismissedAlerts.has(entry._id)
  );

  const summaryText =
    activeTokens === 0
      ? "Skip the physical line. Join a queue, get your token and track everything live."
      : `You have ${activeTokens} active ${
          activeTokens === 1
            ? "token"
            : "tokens"
        } — ${waitingTokens} waiting and ${servingNow} being served.`;

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[65vh] flex-col items-center justify-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
            <RefreshCw
              size={30}
              className="animate-spin text-indigo-400 motion-reduce:animate-none"
            />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-400">
            Preparing your QueueX experience...
          </p>

        </div>
      </DashboardLayout>
    );
  }

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <DashboardLayout>

      <div className="min-w-0 max-w-full space-y-10 sm:space-y-12">

        {/* ==================================
            PREMIUM WELCOME HERO
        ================================== */}

        <section className="relative min-w-0 overflow-hidden rounded-[28px] border border-indigo-400/20 bg-gradient-to-br from-[#34328b] via-[#29275f] to-[#142746] p-5 shadow-2xl shadow-indigo-950/20 sm:p-8 lg:p-10">

          {/* DECORATIVE GLOWS */}

          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 flex min-w-0 flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0 max-w-2xl">

              {/* EYEBROW */}

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-indigo-100 backdrop-blur">
                <Sparkles size={14} />
                Your Smart Queue Experience
              </div>

              <h1 className="break-words text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Your Time Matters.
                <br />

                <span className="bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">
                  Skip the Waiting.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-indigo-100/75 sm:text-base">
                {summaryText}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">

                <ConnectionStatus />

                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/85">
                  <ShieldCheck size={15} />
                  Secure Digital Tokens
                </span>

              </div>

            </div>

            {/* HERO TOKEN VISUAL */}

            <div className="relative mx-auto flex w-full max-w-[260px] shrink-0 items-center justify-center lg:mx-0">

              <div className="absolute h-48 w-48 rounded-full border border-white/10" />

              <div className="absolute h-60 w-60 rounded-full border border-white/5" />

              <div className="relative flex h-44 w-44 flex-col items-center justify-center rounded-[32px] border border-white/20 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur-xl">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-cyan-200">
                  <Ticket size={26} />
                </div>

                <span className="mt-3 text-4xl font-black text-white">
                  {activeTokens}
                </span>

                <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-indigo-200">
                  Active Tokens
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================
            DASHBOARD CONTROLS
        ================================== */}

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Activity
              size={17}
              className="text-emerald-400"
            />

            Your personal queue overview
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">

            {/* NOTIFICATIONS */}

            {notificationPermission ===
            "granted" ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-300">
                <Bell size={15} />
                Notifications ON
              </div>
            ) : (
              <button
                onClick={enableNotifications}
                className={SECONDARY_BUTTON}
              >
                <Bell size={16} />
                Enable Alerts
              </button>
            )}

            {/* SOUND */}

            <button
              onClick={toggleSound}
              aria-pressed={soundEnabled}
              className={
                soundEnabled
                  ? `${BUTTON} border border-indigo-400/30 bg-indigo-500/15 text-indigo-300`
                  : SECONDARY_BUTTON
              }
            >
              {soundEnabled ? (
                <Volume2 size={16} />
              ) : (
                <VolumeX size={16} />
              )}

              Sound {soundEnabled ? "ON" : "OFF"}
            </button>

            {/* REFRESH */}

            <button
              onClick={refreshDashboard}
              className={SECONDARY_BUTTON}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

          </div>

        </div>

        {/* ERROR */}

        <ErrorAlert message={error} />

        {/* YOUR TURN ALERT */}

        {servingEntries.map((entry) => (
          <YourTurnAlert
            key={entry._id}
            queueName={
              entry.queue?.name || "Your Queue"
            }
            tokenNumber={entry.tokenNumber}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onDismiss={() =>
              dismissAlert(entry._id)
            }
          />
        ))}

        {/* ==================================
            PREMIUM STATS
        ================================== */}

        <section className="min-w-0">

          <SectionHeader
            icon={Activity}
            eyebrow="Live Overview"
            title="Your Queue Statistics"
            subtitle="Everything you need to know, at a glance."
          />

          <div className={STAT_GRID}>

            <StatCard
              title="Active Tokens"
              value={activeTokens}
              icon={Ticket}
              color="cyan"
            />

            <StatCard
              title="Available Queues"
              value={queues.length}
              icon={ListOrdered}
              color="purple"
            />

            <StatCard
              title="Waiting Tokens"
              value={waitingTokens}
              icon={Clock}
              color="orange"
            />

            <StatCard
              title="Completed Services"
              value={completedServices}
              icon={CheckCircle}
              color="green"
            />

          </div>

        </section>

        {/* ==================================
            MY ACTIVE QUEUES
        ================================== */}

        <section className="min-w-0">

          <SectionHeader
            icon={Ticket}
            eyebrow="My Digital Tokens"
            title="My Active Queues"
            subtitle="Track your position and service status in real time."
          />

          {myEntries.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="Your Queue Journey Starts Here"
              description="You don't have an active token yet. Explore available queues below and join one in seconds."
            />
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">

              {myEntries.map((entry) => {

                const isServing =
                  entry.status === "serving";

                return (
                  <article
                    key={entry._id}
                    className={`${CARD} p-4 transition-colors duration-300 hover:border-indigo-400/25 sm:p-6`}
                  >

                    {/* TOKEN */}

                    <TokenTicket entry={entry} />

                    {/* QUEUE METRICS */}

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3 sm:p-4">

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <ListOrdered
                            size={15}
                            className="shrink-0 text-violet-400"
                          />
                          Queue Position
                        </div>

                        <p className="mt-3 break-words text-xl font-extrabold text-white sm:text-2xl">
                          {isServing
                            ? "Serving"
                            : entry.position ?? "—"}
                        </p>

                      </div>

                      <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3 sm:p-4">

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <PlayCircle
                            size={15}
                            className="shrink-0 text-emerald-400"
                          />
                          Now Serving
                        </div>

                        <p className="mt-3 break-words text-xl font-extrabold text-emerald-300 sm:text-2xl">
                          {entry.currentlyServingToken != null
                            ? `#${entry.currentlyServingToken}`
                            : "None"}
                        </p>

                      </div>

                    </div>

                    {/* COUNTDOWN */}

                    <div className="relative mt-4 min-w-0 overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.08] to-indigo-500/[0.08] p-4 sm:p-5">

                      <div className="mb-4 flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                          <Hourglass size={18} />
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white">
                            Smart Waiting Countdown
                          </h4>

                          <p className="text-xs text-slate-400">
                            Real-time estimated wait
                          </p>
                        </div>

                      </div>

                      <LiveWaitingCountdown
                        estimatedWaitingTime={
                          entry.estimatedWaitingTime
                        }
                        status={entry.status}
                        queueStatus={
                          entry.queue?.status
                        }
                        resetKey={`${entry._id}-${entry.estimatedWaitingTime}-${entry.status}-${entry.queue?.status}`}
                      />

                      <p className="mt-4 text-xs leading-relaxed text-slate-500">
                        Estimated time may change depending on queue progress.
                      </p>

                    </div>

                    {/* STATUS */}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">

                      <span className="text-sm text-slate-400">
                        Queue Status
                      </span>

                      <StatusBadge
                        status={entry.queue?.status}
                      />

                    </div>

                    {/* YOUR TURN */}

                    {isServing && (
                      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">

                        <CheckCircle
                          size={23}
                          className="shrink-0 text-emerald-300"
                        />

                        <div>
                          <p className="font-bold text-emerald-300">
                            🎉 It's Your Turn!
                          </p>

                          <p className="mt-1 text-sm leading-relaxed text-slate-300">
                            Please proceed to the service counter.
                          </p>
                        </div>

                      </div>
                    )}

                    {/* LEAVE BUTTON */}

                    {entry.status === "waiting" && (
                      <button
                        disabled={
                          !!actionLoading ||
                          !!pendingLeaveEntryId
                        }
                        onClick={() =>
                          leaveQueue(entry._id)
                        }
                        className={`${BUTTON} mt-5 w-full border border-rose-400/20 bg-rose-500/10 text-rose-300 enabled:hover:bg-rose-500/20`}
                      >
                        {actionLoading ===
                        `leave-${entry._id}` ? (
                          <RefreshCw
                            size={17}
                            className="animate-spin motion-reduce:animate-none"
                          />
                        ) : (
                          <XCircle size={17} />
                        )}

                        {actionLoading ===
                        `leave-${entry._id}`
                          ? "Leaving..."
                          : "Leave Queue"}
                      </button>
                    )}

                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* ==================================
            AVAILABLE QUEUES
        ================================== */}

        <section className="min-w-0">

          <SectionHeader
            icon={ListOrdered}
            eyebrow="Explore Services"
            title="Available Queues"
            subtitle="Choose a service, join virtually and save valuable time."
            action={
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-300">
                <Radio size={14} />
                {queues.length} Queues Available
              </span>
            }
          />

          {queues.length === 0 ? (
            <EmptyState
              icon={ListOrdered}
              title="No Queues Available"
              description="There are no available services right now. Please check back shortly."
            />
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {queues.map((queue) => {

                const alreadyJoined =
                  myEntries.some(
                    (entry) =>
                      entry.queue?._id ===
                      queue._id
                  );

                const isPaused =
                  queue.status === "paused";

                const isJoining =
                  actionLoading ===
                  `join-${queue._id}`;

                return (
                  <article
                    key={queue._id}
                    className={`${CARD} group flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:shadow-indigo-500/10 sm:p-6`}
                  >

                    {/* CARD TOP */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/20 to-violet-500/10 text-indigo-300 transition-transform duration-300 group-hover:scale-110">
                        <Ticket size={26} />
                      </div>

                      <StatusBadge status={queue.status} />

                    </div>

                    {/* CONTENT */}

                    <div className="mt-6 flex-1">

                      <h3 className="break-words text-xl font-bold tracking-tight text-white">
                        {queue.name}
                      </h3>

                      <p className="mt-3 min-h-[48px] break-words text-sm leading-7 text-slate-400">
                        {queue.description ||
                          "Join this queue and follow your token live from anywhere."}
                      </p>

                    </div>

                    {/* SERVICE TIME */}

                    <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                          <Clock size={18} />
                        </div>

                        <span className="text-xs font-medium text-slate-400">
                          Avg. Service Time
                        </span>

                      </div>

                      <span className="shrink-0 text-sm font-extrabold text-white">
                        {queue.averageServiceTime ?? 5} min
                      </span>

                    </div>

                    {/* JOIN BUTTON */}

                    <button
                      disabled={
                        !!actionLoading ||
                        !!pendingLeaveEntryId ||
                        alreadyJoined ||
                        queue.status !== "active"
                      }
                      onClick={() =>
                        joinQueue(queue._id)
                      }
                      className={`mt-5 w-full ${
                        alreadyJoined
                          ? `${BUTTON} bg-emerald-500/10 text-emerald-300`
                          : isPaused
                          ? `${BUTTON} bg-amber-500/10 text-amber-300`
                          : PRIMARY_BUTTON
                      }`}
                    >

                      {isJoining ? (
                        <RefreshCw
                          size={17}
                          className="animate-spin motion-reduce:animate-none"
                        />
                      ) : alreadyJoined ? (
                        <CheckCircle size={17} />
                      ) : isPaused ? (
                        <Clock size={17} />
                      ) : (
                        <ArrowRight size={17} />
                      )}

                      {isJoining
                        ? "Joining Queue..."
                        : alreadyJoined
                        ? "Already Joined"
                        : isPaused
                        ? "Temporarily Paused"
                        : "Join Queue Now"}

                    </button>

                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* ==================================
            MY QUEUE HISTORY
        ================================== */}

        <section className="min-w-0">

          <SectionHeader
            icon={History}
            eyebrow="Your Journey"
            title="My Queue History"
            subtitle="Review your completed services and cancelled tokens."
            action={
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-slate-300">
                {history.length} Records
              </span>
            }
          />

          <div className={CARD}>

            {historyLoading ? (

              <div className="space-y-3 p-5 sm:p-6">

                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-14 animate-pulse rounded-xl bg-white/[0.05] motion-reduce:animate-none"
                  />
                ))}

              </div>

            ) : historyError ? (

              <div className="p-5 sm:p-6">
                <ErrorAlert message={historyError} />
              </div>

            ) : history.length === 0 ? (

              <div className="p-5">
                <EmptyState
                  icon={History}
                  title="Your History Is Waiting"
                  description="Once you complete or leave a queue, your records will appear here."
                />
              </div>

            ) : (
              <>

                {/* MOBILE CARDS */}

                <div className="grid grid-cols-1 gap-3 p-3 md:hidden">

                  {history.map((entry) => (
                    <MobileHistoryCard
                      key={entry._id}
                      entry={entry}
                    />
                  ))}

                </div>

                {/* DESKTOP TABLE */}

                <div className="hidden min-w-0 overflow-x-auto md:block">

                  <table className="w-full min-w-[850px] text-left">

                    <thead className="border-b border-white/[0.07] bg-white/[0.035]">

                      <tr>

                        {[
                          "Queue",
                          "Token",
                          "Status",
                          "Joined At",
                          "Waiting",
                          "Service",
                          "Completed At",
                        ].map((heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className="whitespace-nowrap px-5 py-5 text-xs font-bold uppercase tracking-wide text-slate-400"
                          >
                            {heading}
                          </th>
                        ))}

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-white/[0.05]">

                      {history.map((entry) => (

                        <tr
                          key={entry._id}
                          className="transition-colors hover:bg-indigo-500/[0.06]"
                        >

                          <td className="px-5 py-5">
                            <div className="flex items-center gap-2 text-sm font-semibold text-white">
                              <MapPin
                                size={15}
                                className="shrink-0 text-indigo-400"
                              />

                              <span className="break-words">
                                {entry.queue?.name ||
                                  "Deleted Queue"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-5 text-sm font-extrabold text-indigo-300">
                            #{entry.tokenNumber}
                          </td>

                          <td className="px-5 py-5">
                            <StatusBadge status={entry.status} />
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-300">
                            {formatDate(entry.joinedAt)}
                          </td>

                          <td className="px-5 py-5 text-sm text-slate-300">
                            {formatMinutes(entry.waitingTime)}
                          </td>

                          <td className="px-5 py-5 text-sm text-slate-300">
                            {formatMinutes(entry.serviceDuration)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-300">
                            {entry.status ===
                            "completed"
                              ? formatDate(entry.completedAt)
                              : "—"}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </>
            )}

          </div>

        </section>

        {/* ==================================
            BOTTOM BRAND BANNER
        ================================== */}

        <section className="relative overflow-hidden rounded-[24px] border border-indigo-400/15 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-cyan-500/5 p-6 sm:p-8">

          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">

            <div className="flex min-w-0 items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
                <Zap size={24} />
              </div>

              <div className="min-w-0">

                <h3 className="text-lg font-bold text-white">
                  Less Waiting. More Living.
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  QueueX keeps you updated, so you can focus on what matters.
                </p>

              </div>

            </div>

            <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-300">
              Powered by QueueX
              <ChevronRight size={17} />
            </span>

          </div>

        </section>

      </div>

      {/* ==================================
          LEAVE CONFIRMATION MODAL
      ================================== */}

      <ConfirmModal
        isOpen={!!pendingLeaveEntryId}
        title="Leave Queue"
        message={leaveConfirmationMessage}
        confirmText="Leave Queue"
        cancelText="Cancel"
        variant="danger"
        loading={
          !!pendingLeaveEntryId &&
          actionLoading ===
            `leave-${pendingLeaveEntryId}`
        }
        onConfirm={confirmLeaveQueue}
        onCancel={cancelLeaveQueue}
      />

    </DashboardLayout>
  );
}

export default UserDashboard;