import {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import toast from "react-hot-toast";

import { connectSocket } from "../services/socket";

import {
  Users,
  ListOrdered,
  Clock,
  Activity,
  Plus,
  Play,
  Pause,
  Lock,
  CheckCircle,
  RefreshCw,
  Ticket,
  CalendarCheck,
  Timer,
  BarChart3,
  RotateCcw,
  TrendingUp,
  Gauge,
  Inbox,
  AlertTriangle,
} from "lucide-react";

import DashboardLayout from "../components/layout/DashboardLayout";
import StatCard from "../components/dashboard/StatCard";
import AnalyticsCharts from "../components/dashboard/AnalyticsCharts";
import ConnectionStatus from "../components/dashboard/ConnectionStatus";

import ConfirmModal from "../components/common/ConfirmModal";
import CreateQueueModal from "../components/common/CreateQueueModal";

import api from "../services/api";

// ==========================================
// DESIGN TOKENS (shared class strings)
// ==========================================

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const BTN_BASE = `inline-flex min-w-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none ${FOCUS_RING}`;

const STAT_GRID =
  "grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4";

// ==========================================
// STATUS STYLES
// ==========================================

const STATUS_META = {
  active: {
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
    card: "border-slate-700/70",
  },
  paused: {
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
    card: "border-amber-500/20",
  },
  closed: {
    pill: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-400",
    card: "border-red-500/20",
  },
};

const DEFAULT_STATUS_META = {
  pill: "border-slate-500/30 bg-slate-500/10 text-slate-400",
  dot: "bg-slate-400",
  card: "border-slate-700/70",
};

const getStatusMeta = (status) =>
  STATUS_META[status] || DEFAULT_STATUS_META;

// ==========================================
// CENTRALIZED ERROR MESSAGE HELPER
// ==========================================

const getErrorMessage = (err, fallback) => {
  return (
    err.userMessage ||
    err.response?.data?.message ||
    fallback
  );
};

// ==========================================
// CONFIRMATION CONFIGURATION
// ==========================================

const getConfirmationConfig = (action) => {
  if (!action) return {};

  const { queueName, status, currentStatus } = action;

  if (currentStatus === "closed" && status === "active") {
    return {
      title: "Reopen Queue",
      message:
        `Reopen "${queueName}"?\n\n` +
        "Users will be able to join this queue again. Existing token history will be preserved.",
      confirmText: "Reopen Queue",
      variant: "success",
    };
  }

  if (status === "paused") {
    return {
      title: "Pause Queue",
      message:
        `Pause "${queueName}"?\n\n` +
        "New customers will not be able to join until this queue is resumed.",
      confirmText: "Pause Queue",
      variant: "warning",
    };
  }

  if (status === "active") {
    return {
      title: "Resume Queue",
      message:
        `Resume "${queueName}"?\n\n` +
        "Customers will be able to join and queue processing can continue.",
      confirmText: "Resume Queue",
      variant: "info",
    };
  }

  if (status === "closed") {
    return {
      title: "Close Queue",
      message:
        `Close "${queueName}"?\n\n` +
        "Users will not be able to join this queue while it is closed. You can reopen it later.",
      confirmText: "Close Queue",
      variant: "danger",
    };
  }

  return {};
};

// ==========================================
// SMALL PRESENTATIONAL COMPONENTS
// ==========================================

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize sm:text-sm ${meta.pill}`}
    >
      <span className="relative flex h-2 w-2">
        {status === "active" && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:animate-none ${meta.dot}`}
          />
        )}

        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${meta.dot}`}
        />
      </span>

      {status}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex min-w-0 items-start gap-3 sm:mb-6">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sky-400 ring-1 ring-slate-700">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
          {title}
        </h2>

        <p className="mt-0.5 text-sm leading-relaxed text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ErrorAlert({ message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="mb-5 flex min-w-0 items-start gap-3 break-words rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
    >
      <AlertTriangle
        size={18}
        className="mt-0.5 shrink-0 text-red-400"
      />

      <span className="min-w-0">{message}</span>
    </div>
  );
}

function StatGridSkeleton() {
  return (
    <div className={STAT_GRID}>
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-28 animate-pulse rounded-2xl border border-slate-700/60 bg-slate-800/60 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

function QueueCardSkeleton() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-96 animate-pulse rounded-2xl border border-slate-700/60 bg-slate-800/60 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

// The one memorable element: the live token "ticket"

function ServingTicket({ serving }) {
  if (!serving) {
    return (
      <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-4 sm:p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-500">
          <Ticket size={22} />
        </div>

        <p className="min-w-0 break-words text-sm text-slate-400">
          No customer currently serving
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-w-0 overflow-hidden rounded-2xl bg-sky-500/10 ring-1 ring-sky-400/30">
      {/* TOKEN STUB */}

      <div className="relative flex min-w-[6.5rem] shrink-0 flex-col items-center justify-center px-4 py-5 sm:min-w-[8rem]">
        <span className="text-xs font-medium text-sky-300/80">
          Token
        </span>

        <span className="mt-1 text-4xl font-extrabold leading-none tabular-nums text-sky-300 sm:text-5xl">
          {serving.tokenNumber}
        </span>

        <span className="absolute inset-y-0 right-0 border-l-2 border-dashed border-sky-400/30" />

        <span className="absolute -top-2 right-0 h-4 w-4 translate-x-1/2 rounded-full bg-slate-800" />

        <span className="absolute -bottom-2 right-0 h-4 w-4 translate-x-1/2 rounded-full bg-slate-800" />
      </div>

      {/* CUSTOMER */}

      <div className="min-w-0 flex-1 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-medium text-sky-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75 motion-reduce:animate-none" />

            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
          </span>

          Currently serving
        </div>

        <p className="mt-2 break-words text-lg font-semibold text-white sm:text-xl">
          {serving.user?.name || "Unknown User"}
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Token #{serving.tokenNumber} in service
        </p>
      </div>
    </div>
  );
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================

function AdminDashboard() {
  const [queues, setQueues] = useState([]);
  const [queueDetails, setQueueDetails] = useState({});

  const [analytics, setAnalytics] = useState(null);
  const [charts, setCharts] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] =
    useState(true);

  const [chartsLoading, setChartsLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(null);

  const [error, setError] = useState("");
  const [analyticsError, setAnalyticsError] =
    useState("");

  const [chartsError, setChartsError] =
    useState("");

  // ========================================
  // MODAL STATES
  // ========================================

  const [pendingAction, setPendingAction] =
    useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const createRequestInProgressRef = useRef(false);

  // ========================================
  // JWT AUTHORIZATION
  // ========================================

  const getHeaders = () => ({
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
  });

  // ========================================
  // FETCH QUEUES
  // ========================================

  const fetchQueues = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/queues", {
        headers: getHeaders(),
      });

      const fetchedQueues = response.data.queues || [];

      setQueues(fetchedQueues);

      const results = await Promise.allSettled(
        fetchedQueues.map((queue) =>
          api.get(`/queues/${queue._id}`, {
            headers: getHeaders(),
          })
        )
      );

      const details = {};

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          details[fetchedQueues[index]._id] =
            result.value.data;
        } else {
          console.error(
            "Failed to fetch queue details:",
            fetchedQueues[index].name,
            result.reason
          );
        }
      });

      setQueueDetails(details);
    } catch (err) {
      console.error("Fetch queues error:", err);

      setError(
        getErrorMessage(
          err,
          "Failed to load queues."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================
  // FETCH ANALYTICS
  // ========================================

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsError("");

      const response = await api.get(
        "/analytics/admin",
        {
          headers: getHeaders(),
        }
      );

      setAnalytics(response.data.analytics);
    } catch (err) {
      console.error("Analytics fetch error:", err);

      setAnalyticsError(
        getErrorMessage(
          err,
          "Failed to load analytics."
        )
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // ========================================
  // FETCH CHARTS
  // ========================================

  const fetchCharts = useCallback(async () => {
    try {
      setChartsError("");

      const response = await api.get(
        "/analytics/admin/charts",
        {
          headers: getHeaders(),
        }
      );

      setCharts(response.data.charts);
    } catch (err) {
      console.error("Charts fetch error:", err);

      setChartsError(
        getErrorMessage(
          err,
          "Failed to load charts."
        )
      );
    } finally {
      setChartsLoading(false);
    }
  }, []);

  // ========================================
  // REFRESH DASHBOARD
  // ========================================

  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      fetchQueues(),
      fetchAnalytics(),
      fetchCharts(),
    ]);
  }, [
    fetchQueues,
    fetchAnalytics,
    fetchCharts,
  ]);

  // ========================================
  // SOCKET.IO REAL-TIME UPDATES
  // ========================================

  useEffect(() => {
    refreshDashboard();

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
    socket.on("queue_updated", handleQueueUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("queue_updated", handleQueueUpdate);
    };
  }, [refreshDashboard]);

  // ========================================
  // OPEN CREATE QUEUE MODAL
  // ========================================

  const openCreateQueueModal = () => {
    if (
      actionLoading ||
      pendingAction ||
      createRequestInProgressRef.current
    ) {
      return;
    }

    setIsCreateModalOpen(true);
  };

  // ========================================
  // CLOSE CREATE QUEUE MODAL
  // ========================================

  const closeCreateQueueModal = useCallback(() => {
    if (createRequestInProgressRef.current) {
      return;
    }

    setIsCreateModalOpen(false);
  }, []);

  // ========================================
  // CREATE QUEUE
  // ========================================

  const createQueue = async (formData) => {
    if (
      !isCreateModalOpen ||
      actionLoading ||
      createRequestInProgressRef.current
    ) {
      return;
    }

    createRequestInProgressRef.current = true;

    setActionLoading("create");

    const toastId = toast.loading("Creating queue...");

    try {
      const response = await api.post(
        "/queues",
        {
          name: formData.name,
          description: formData.description,
          averageServiceTime:
            formData.averageServiceTime,
        },
        {
          headers: getHeaders(),
        }
      );

      const createdQueueName =
        response.data.queue?.name ||
        formData.name;

      toast.success(
        `"${createdQueueName}" queue created successfully!`,
        { id: toastId }
      );

      setIsCreateModalOpen(false);

      await refreshDashboard();
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to create queue."
        ),
        { id: toastId }
      );
    } finally {
      createRequestInProgressRef.current = false;
      setActionLoading(null);
    }
  };

  // ========================================
  // CALL NEXT CUSTOMER
  // ========================================

  const callNext = async (queueId) => {
    if (actionLoading || isCreateModalOpen || pendingAction) {
      return;
    }

    const toastId = toast.loading(
      "Calling next customer..."
    );

    try {
      setActionLoading(queueId);

      const response = await api.post(
        `/queues/${queueId}/next`,
        {},
        {
          headers: getHeaders(),
        }
      );

      toast.success(
        `Token #${response.data.entry.tokenNumber} called successfully!`,
        { id: toastId }
      );

      await refreshDashboard();
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to call next customer."
        ),
        { id: toastId }
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================
  // COMPLETE SERVICE
  // ========================================

  const completeService = async (entryId, queueId) => {
    if (actionLoading || isCreateModalOpen || pendingAction) {
      return;
    }

    if (!entryId) {
      toast.error("No customer currently serving.");
      return;
    }

    const toastId = toast.loading(
      "Completing service..."
    );

    try {
      setActionLoading(queueId);

      await api.patch(
        `/queues/entries/${entryId}/complete`,
        {},
        {
          headers: getHeaders(),
        }
      );

      toast.success(
        "Service completed successfully!",
        { id: toastId }
      );

      await refreshDashboard();
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to complete service."
        ),
        { id: toastId }
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================
  // OPEN STATUS CONFIRMATION MODAL
  // ========================================

  const requestStatusChange = (
    queueId,
    status,
    queueName,
    currentStatus
  ) => {
    if (
      actionLoading ||
      isCreateModalOpen ||
      pendingAction
    ) {
      return;
    }

    setPendingAction({
      queueId,
      status,
      queueName,
      currentStatus,
    });
  };

  // ========================================
  // CLOSE STATUS CONFIRMATION MODAL
  // ========================================

  const closeStatusConfirmation = useCallback(() => {
    if (actionLoading) return;

    setPendingAction(null);
  }, [actionLoading]);

  // ========================================
  // CONFIRM STATUS CHANGE
  // ========================================

  const confirmStatusChange = async () => {
    if (!pendingAction || actionLoading) return;

    const {
      queueId,
      status,
      queueName,
      currentStatus,
    } = pendingAction;

    const isReopening =
      currentStatus === "closed" &&
      status === "active";

    const toastId = toast.loading(
      isReopening
        ? "Reopening queue..."
        : "Updating queue status..."
    );

    try {
      setActionLoading(queueId);

      await api.patch(
        `/queues/${queueId}/status`,
        { status },
        {
          headers: getHeaders(),
        }
      );

      let successMessage = "";

      if (isReopening) {
        successMessage =
          `"${queueName}" reopened successfully!`;
      } else if (status === "paused") {
        successMessage =
          `"${queueName}" paused successfully!`;
      } else if (status === "active") {
        successMessage =
          `"${queueName}" resumed successfully!`;
      } else if (status === "closed") {
        successMessage =
          `"${queueName}" closed successfully!`;
      }

      toast.success(successMessage, {
        id: toastId,
      });

      setPendingAction(null);

      await refreshDashboard();
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to update queue status."
        ),
        { id: toastId }
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================
  // QUEUE STATISTICS
  // ========================================

  const totalWaiting = Object.values(queueDetails).reduce(
    (sum, detail) => sum + (detail.waitingCount || 0),
    0
  );

  const activeQueues = queues.filter(
    (queue) => queue.status === "active"
  ).length;

  const averageServiceTime = queues.length
    ? Math.round(
        queues.reduce(
          (sum, queue) =>
            sum + (Number(queue.averageServiceTime) || 0),
          0
        ) / queues.length
      )
    : 0;

  const confirmationConfig =
    getConfirmationConfig(pendingAction);

  const summaryText = loading
    ? "Manage queues and monitor activity in real time."
    : `${activeQueues} of ${queues.length} ${
        queues.length === 1 ? "queue is" : "queues are"
      } active, with ${totalWaiting} ${
        totalWaiting === 1 ? "customer" : "customers"
      } waiting right now.`;

  const createDisabled =
    !!actionLoading ||
    isCreateModalOpen ||
    !!pendingAction;

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <DashboardLayout>
      <div className="min-w-0 max-w-full">

        {/* HEADER */}

        <header className="mb-10 flex min-w-0 flex-col gap-6 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              {summaryText}
            </p>

            <div className="mt-4">
              <ConnectionStatus />
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap gap-2 sm:gap-3">
            <button
              onClick={refreshDashboard}
              disabled={!!actionLoading}
              className={`${BTN_BASE} flex-1 border border-slate-700 bg-slate-800 text-slate-200 enabled:hover:bg-slate-700 sm:flex-none`}
            >
              <RefreshCw
                size={17}
                className={`shrink-0 ${
                  loading
                    ? "animate-spin motion-reduce:animate-none"
                    : ""
                }`}
              />

              Refresh
            </button>

            <button
              onClick={openCreateQueueModal}
              disabled={createDisabled}
              className={`${BTN_BASE} flex-1 bg-sky-500 text-white shadow-lg shadow-sky-500/20 enabled:hover:bg-sky-400 sm:flex-none sm:px-5`}
            >
              {actionLoading === "create" ? (
                <RefreshCw
                  size={18}
                  className="shrink-0 animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Plus
                  size={18}
                  className="shrink-0"
                />
              )}

              {actionLoading === "create"
                ? "Creating..."
                : "Create Queue"}
            </button>
          </div>
        </header>

        {/* ERRORS */}

        <ErrorAlert message={error} />
        <ErrorAlert message={analyticsError} />
        <ErrorAlert message={chartsError} />

        {/* QUEUE OVERVIEW */}

        <section className="mb-12 min-w-0">
          <SectionHeader
            icon={Activity}
            title="Queue Overview"
            subtitle="Live overview of your queue operations."
          />

          <div className={STAT_GRID}>
            <StatCard
              title="Total Queues"
              value={queues.length}
              icon={ListOrdered}
              color="sky"
            />

            <StatCard
              title="Active Queues"
              value={activeQueues}
              icon={Activity}
              color="green"
            />

            <StatCard
              title="Waiting Customers"
              value={totalWaiting}
              icon={Users}
              color="purple"
            />

            <StatCard
              title="Average Service Time"
              value={`${averageServiceTime} min`}
              icon={Clock}
              color="orange"
            />
          </div>
        </section>

        {/* ANALYTICS OVERVIEW */}

        <section className="mb-12 min-w-0">
          <SectionHeader
            icon={BarChart3}
            title="Analytics Overview"
            subtitle="Performance statistics calculated from MongoDB."
          />

          {analyticsLoading && !analytics ? (
            <StatGridSkeleton />
          ) : (
            <div className={STAT_GRID}>
              <StatCard
                title="Total Tokens Generated"
                value={analytics?.totalEntries ?? "—"}
                icon={Ticket}
                color="sky"
              />

              <StatCard
                title="Completed Services"
                value={analytics?.completedServices ?? "—"}
                icon={CheckCircle}
                color="green"
              />

              <StatCard
                title="Today's Completed"
                value={analytics?.todayCompleted ?? "—"}
                icon={CalendarCheck}
                color="purple"
              />

              <StatCard
                title="Average Waiting Time"
                value={
                  analytics
                    ? `${analytics.averageWaitingTime} min`
                    : "—"
                }
                icon={Timer}
                color="orange"
              />
            </div>
          )}
        </section>

        {/* ANALYTICS CHARTS */}

        <section className="mb-12 min-w-0">
          <SectionHeader
            icon={TrendingUp}
            title="Analytics Charts"
            subtitle="Visual insights into queue activity and performance."
          />

          {chartsLoading && !charts ? (
            <div className="h-72 animate-pulse rounded-2xl border border-slate-700/60 bg-slate-800/60 motion-reduce:animate-none" />
          ) : (
            <AnalyticsCharts charts={charts} />
          )}
        </section>

        {/* QUEUE PERFORMANCE */}

        <section className="mb-12 min-w-0">
          <SectionHeader
            icon={Gauge}
            title="Queue Performance"
            subtitle="Individual queue statistics."
          />

          {analytics?.queueAnalytics?.length > 0 ? (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              {analytics.queueAnalytics.map((queue) => {
                const completionRate =
                  queue.totalEntries > 0
                    ? Math.round(
                        (queue.completedServices /
                          queue.totalEntries) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={queue.queueId}
                    className="min-w-0 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-800 p-4 sm:p-6"
                  >
                    <div className="mb-5 flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 break-words text-lg font-semibold text-white sm:text-xl">
                        {queue.queueName}
                      </h3>

                      <StatusBadge status={queue.status} />
                    </div>

                    {/* COMPLETION METER */}

                    <div className="mb-5">
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-400 sm:text-sm">
                        <span>Completion rate</span>

                        <span className="font-semibold tabular-nums text-slate-200">
                          {completionRate}%
                        </span>
                      </div>

                      <div
                        className="h-2 overflow-hidden rounded-full bg-slate-900"
                        role="progressbar"
                        aria-valuenow={completionRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${queue.queueName} completion rate`}
                      >
                        <div
                          className="h-full rounded-full bg-sky-400 transition-all duration-700 motion-reduce:transition-none"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* NUMBERS */}

                    <dl className="grid min-w-0 grid-cols-3 divide-x divide-slate-700/70 rounded-xl bg-slate-900/60 py-4">
                      <div className="min-w-0 px-3 sm:px-5">
                        <dt className="text-xs text-slate-400">
                          Total tokens
                        </dt>

                        <dd className="mt-1.5 break-words text-xl font-bold tabular-nums text-white sm:text-2xl">
                          {queue.totalEntries}
                        </dd>
                      </div>

                      <div className="min-w-0 px-3 sm:px-5">
                        <dt className="text-xs text-slate-400">
                          Completed
                        </dt>

                        <dd className="mt-1.5 break-words text-xl font-bold tabular-nums text-emerald-400 sm:text-2xl">
                          {queue.completedServices}
                        </dd>
                      </div>

                      <div className="min-w-0 px-3 sm:px-5">
                        <dt className="text-xs text-slate-400">
                          Waiting
                        </dt>

                        <dd className="mt-1.5 break-words text-xl font-bold tabular-nums text-amber-400 sm:text-2xl">
                          {queue.waitingCustomers}
                        </dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 p-6 text-sm text-slate-400">
              No queue analytics available.
            </div>
          )}
        </section>

        {/* QUEUE MANAGEMENT */}

        <section className="min-w-0">
          <SectionHeader
            icon={ListOrdered}
            title="Queue Management"
            subtitle="Monitor and control your queues."
          />

          {loading ? (
            <QueueCardSkeleton />
          ) : queues.length === 0 ? (
            <div className="flex min-w-0 flex-col items-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 px-6 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500 ring-1 ring-slate-700">
                <Inbox size={26} />
              </div>

              <p className="text-base font-semibold text-white">
                No queues created yet
              </p>

              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Create your first queue to start issuing tokens and serving customers.
              </p>

              <button
                onClick={openCreateQueueModal}
                disabled={createDisabled}
                className={`${BTN_BASE} mt-6 bg-sky-500 text-white enabled:hover:bg-sky-400`}
              >
                <Plus size={18} className="shrink-0" />
                Create Queue
              </button>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
              {queues.map((queue) => {
                const details = queueDetails[queue._id];

                const serving = details?.currentlyServing;

                const waitingCount =
                  details?.waitingCount ?? 0;

                const estimatedWait =
                  details?.estimatedWaitingTime ?? 0;

                const isBusy =
                  actionLoading === queue._id;

                const anyActionBusy =
                  !!actionLoading;

                const isActive =
                  queue.status === "active";

                const isPaused =
                  queue.status === "paused";

                const isClosed =
                  queue.status === "closed";

                const meta = getStatusMeta(queue.status);

                return (
                  <div
                    key={queue._id}
                    className={`min-w-0 overflow-hidden rounded-2xl border bg-slate-800 p-4 sm:p-6 ${meta.card}`}
                  >
                    {/* QUEUE HEADER */}

                    <div className="mb-6 flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-lg font-semibold tracking-tight text-white sm:text-xl">
                          {queue.name}
                        </h3>

                        <p className="mt-1 break-words text-sm leading-relaxed text-slate-400">
                          {queue.description || "Queue Management"}
                        </p>
                      </div>

                      <StatusBadge status={queue.status} />
                    </div>

                    {/* QUEUE STATS */}

                    <div className="mb-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="min-w-0 rounded-xl bg-slate-900/60 p-4 ring-1 ring-inset ring-slate-700/40">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Users
                            size={16}
                            className="shrink-0 text-purple-400"
                          />

                          <span className="break-words">
                            Waiting customers
                          </span>
                        </div>

                        <p className="mt-3 break-words text-3xl font-bold tabular-nums text-white">
                          {waitingCount}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl bg-slate-900/60 p-4 ring-1 ring-inset ring-slate-700/40">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock
                            size={16}
                            className="shrink-0 text-amber-400"
                          />

                          <span className="break-words">
                            Estimated wait
                          </span>
                        </div>

                        <p className="mt-3 break-words text-3xl font-bold tabular-nums text-white">
                          {estimatedWait}
                          <span className="ml-1 text-base font-medium text-slate-400">
                            min
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* CURRENTLY SERVING */}

                    <div className="mb-5">
                      <ServingTicket serving={serving} />
                    </div>

                    {/* QUEUE ACTIONS */}

                    <div className="mb-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => callNext(queue._id)}
                        disabled={
                          anyActionBusy ||
                          isCreateModalOpen ||
                          !!pendingAction ||
                          !details ||
                          !isActive ||
                          !!serving ||
                          waitingCount === 0
                        }
                        className={`${BTN_BASE} w-full bg-sky-500 text-white enabled:hover:bg-sky-400`}
                      >
                        {isBusy ? (
                          <RefreshCw
                            size={17}
                            className="shrink-0 animate-spin motion-reduce:animate-none"
                          />
                        ) : (
                          <Play
                            size={17}
                            className="shrink-0"
                          />
                        )}

                        {isBusy
                          ? "Processing..."
                          : "Call Next"}
                      </button>

                      <button
                        onClick={() =>
                          completeService(
                            serving?._id,
                            queue._id
                          )
                        }
                        disabled={
                          anyActionBusy ||
                          isCreateModalOpen ||
                          !!pendingAction ||
                          !serving
                        }
                        className={`${BTN_BASE} w-full bg-emerald-500 text-slate-950 enabled:hover:bg-emerald-400`}
                      >
                        <CheckCircle
                          size={17}
                          className="shrink-0"
                        />

                        Complete Service
                      </button>
                    </div>

                    {/* STATUS MANAGEMENT */}

                    {!isClosed && (
                      <div className="min-w-0 border-t border-slate-700/70 pt-5">
                        <p className="mb-3 text-sm font-medium text-slate-300">
                          Queue Status Management
                        </p>

                        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                          {isActive && (
                            <button
                              disabled={
                                anyActionBusy ||
                                isCreateModalOpen ||
                                !!pendingAction
                              }
                              onClick={() =>
                                requestStatusChange(
                                  queue._id,
                                  "paused",
                                  queue.name,
                                  queue.status
                                )
                              }
                              className={`${BTN_BASE} w-full border border-amber-500/20 bg-amber-500/10 text-amber-400 enabled:hover:bg-amber-500/20`}
                            >
                              <Pause
                                size={17}
                                className="shrink-0"
                              />

                              Pause Queue
                            </button>
                          )}

                          {isPaused && (
                            <button
                              disabled={
                                anyActionBusy ||
                                isCreateModalOpen ||
                                !!pendingAction
                              }
                              onClick={() =>
                                requestStatusChange(
                                  queue._id,
                                  "active",
                                  queue.name,
                                  queue.status
                                )
                              }
                              className={`${BTN_BASE} w-full border border-sky-500/20 bg-sky-500/10 text-sky-400 enabled:hover:bg-sky-500/20`}
                            >
                              <Play
                                size={17}
                                className="shrink-0"
                              />

                              Resume Queue
                            </button>
                          )}

                          <button
                            disabled={
                              anyActionBusy ||
                              isCreateModalOpen ||
                              !!pendingAction ||
                              !details ||
                              !!serving ||
                              waitingCount > 0
                            }
                            onClick={() =>
                              requestStatusChange(
                                queue._id,
                                "closed",
                                queue.name,
                                queue.status
                              )
                            }
                            className={`${BTN_BASE} w-full border border-red-500/20 bg-red-500/10 text-red-400 enabled:hover:bg-red-500/20`}
                          >
                            <Lock
                              size={17}
                              className="shrink-0"
                            />

                            Close Queue
                          </button>
                        </div>

                        {(!!serving || waitingCount > 0) && (
                          <p className="mt-3 break-words text-xs leading-relaxed text-slate-500">
                            Complete or remove all active customers
                            before closing this queue.
                          </p>
                        )}
                      </div>
                    )}

                    {/* CLOSED QUEUE */}

                    {isClosed && (
                      <div className="min-w-0 border-t border-slate-700/70 pt-5">
                        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                          <Lock
                            size={18}
                            className="mt-0.5 shrink-0 text-red-400"
                          />

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-red-400">
                              Queue is currently closed
                            </p>

                            <p className="mt-1 text-xs leading-relaxed text-slate-400">
                              Users cannot join this queue until it is reopened.
                              Existing queue history and tokens are preserved.
                            </p>
                          </div>
                        </div>

                        <button
                          disabled={
                            anyActionBusy ||
                            isCreateModalOpen ||
                            !!pendingAction
                          }
                          onClick={() =>
                            requestStatusChange(
                              queue._id,
                              "active",
                              queue.name,
                              queue.status
                            )
                          }
                          className={`${BTN_BASE} w-full bg-emerald-500 text-slate-950 enabled:hover:bg-emerald-400`}
                        >
                          {isBusy ? (
                            <RefreshCw
                              size={18}
                              className="shrink-0 animate-spin motion-reduce:animate-none"
                            />
                          ) : (
                            <RotateCcw
                              size={18}
                              className="shrink-0"
                            />
                          )}

                          {isBusy
                            ? "Reopening..."
                            : "Reopen Queue"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* STATUS CONFIRMATION MODAL */}
        {/* ================================= */}

        <ConfirmModal
          isOpen={!!pendingAction}
          title={confirmationConfig.title}
          message={confirmationConfig.message}
          confirmText={confirmationConfig.confirmText}
          variant={confirmationConfig.variant}
          loading={!!actionLoading}
          onConfirm={confirmStatusChange}
          onCancel={closeStatusConfirmation}
        />

        {/* ================================= */}
        {/* CREATE QUEUE MODAL */}
        {/* ================================= */}

        <CreateQueueModal
          isOpen={isCreateModalOpen}
          loading={actionLoading === "create"}
          onClose={closeCreateQueueModal}
          onSubmit={createQueue}
        />
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;