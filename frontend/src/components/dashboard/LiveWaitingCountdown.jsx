import { useEffect, useState } from "react";
import {
  Clock3,
  PauseCircle,
  CheckCircle2,
  Hourglass,
  AlertCircle,
} from "lucide-react";

const formatTime = (totalSeconds) => {
  const value = Math.max(0, Math.ceil(totalSeconds));

  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;

  const pad = (number) => String(number).padStart(2, "0");

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};

function LiveWaitingCountdown({
  estimatedWaitingTime,
  status,
  queueStatus,
  resetKey,
}) {
  const hasEstimate =
    estimatedWaitingTime !== null &&
    estimatedWaitingTime !== undefined &&
    Number.isFinite(Number(estimatedWaitingTime));

  const estimatedSeconds = hasEstimate
    ? Math.max(0, Math.round(Number(estimatedWaitingTime) * 60))
    : 0;

  const [remainingSeconds, setRemainingSeconds] =
    useState(estimatedSeconds);

  // Backend estimate ya queue state change hone par timer sync.
  useEffect(() => {
    setRemainingSeconds(estimatedSeconds);
  }, [resetKey, estimatedSeconds]);

  // Countdown runs only while waiting in an active queue.
  useEffect(() => {
    if (status !== "waiting" || queueStatus !== "active") {
      return;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status, queueStatus]);

  if (status === "serving") {
    return (
      <div className="flex items-center gap-3">
        <CheckCircle2 size={24} className="text-emerald-400" />

        <div>
          <p className="text-xl font-bold text-emerald-400">
            🎉 Your Turn!
          </p>
          <p className="text-xs text-slate-400">
            Please proceed to the service counter.
          </p>
        </div>
      </div>
    );
  }

  if (status !== "waiting") {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <AlertCircle size={20} />
        Countdown unavailable for this token.
      </div>
    );
  }

  if (!hasEstimate) {
    return (
      <div className="flex items-center gap-2 text-amber-400">
        <AlertCircle size={20} />
        Waiting time estimate unavailable.
      </div>
    );
  }

  if (queueStatus === "paused") {
    return (
      <div className="flex items-center gap-3">
        <PauseCircle size={24} className="text-amber-400" />

        <div>
          <p className="text-xs text-slate-400">
            Countdown Paused
          </p>
          <p className="font-mono text-3xl font-bold text-amber-400">
            {formatTime(remainingSeconds)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Waiting for queue to resume...
          </p>
        </div>
      </div>
    );
  }

  if (queueStatus !== "active") {
    return (
      <div className="flex items-center gap-2 text-amber-400">
        <PauseCircle size={20} />
        Queue is not active.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-cyan-500/10 p-3">
        <Clock3 size={24} className="text-cyan-400" />
      </div>

      <div>
        <p className="text-xs text-slate-400">
          Live Estimated Wait
        </p>

        <p
          aria-live="off"
          className="font-mono text-3xl font-bold tracking-wider text-white"
        >
          {formatTime(remainingSeconds)}
        </p>

        {remainingSeconds <= 0 ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-amber-400">
            <Hourglass size={13} />
            Estimate reached — waiting for queue update...
          </p>
        ) : (
          <p className="mt-1 text-xs text-cyan-400">
            Countdown running...
          </p>
        )}
      </div>
    </div>
  );
}

export default LiveWaitingCountdown;