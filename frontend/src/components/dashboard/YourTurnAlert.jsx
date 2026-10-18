import {
  BellRing,
  CheckCircle,
  Volume2,
  VolumeX,
  X
} from "lucide-react";

// =====================================
// Play Notification Sound
// =====================================

export const playNotificationSound = async () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    gainNode.gain.setValueAtTime(
      0.15,
      audioContext.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.5
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);

    oscillator.onended = () => {
      audioContext.close();
    };

  } catch (error) {
    console.error("Notification sound error:", error);
  }
};

// =====================================
// Your Turn Alert Component
// =====================================

function YourTurnAlert({
  queueName,
  tokenNumber,
  onDismiss,
  soundEnabled,
  onToggleSound
}) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-green-500/40 bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-slate-800 p-6 shadow-lg shadow-green-500/10 animate-pulse">

      {/* Dismiss Button */}

      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        title="Dismiss alert"
      >
        <X size={20} />
      </button>

      <div className="flex flex-col sm:flex-row gap-5 items-start">

        <div className="bg-green-500/20 p-4 rounded-2xl">
          <BellRing
            size={32}
            className="text-green-400"
          />
        </div>

        <div className="flex-1">

          <div className="flex items-center gap-2 mb-2">

            <CheckCircle
              size={20}
              className="text-green-400"
            />

            <h2 className="text-2xl font-bold text-green-400">
              🎉 Your Turn!
            </h2>

          </div>

          <p className="text-lg text-white">
            Your token{" "}

            <span className="font-bold text-sky-400">
              #{tokenNumber}
            </span>

            {" "}is now being served.
          </p>

          <p className="text-slate-300 mt-2">
            Queue:{" "}

            <span className="font-semibold">
              {queueName}
            </span>
          </p>

          <p className="text-sm text-slate-400 mt-3">
            Please proceed to the service counter.
          </p>

          {/* Sound Toggle */}

          <button
            onClick={onToggleSound}
            className="flex items-center gap-2 mt-5 text-sm bg-slate-900/70 hover:bg-slate-900 px-4 py-2 rounded-lg transition"
          >
            {soundEnabled ? (
              <>
                <Volume2
                  size={17}
                  className="text-green-400"
                />
                Sound Enabled
              </>
            ) : (
              <>
                <VolumeX size={17} />
                Enable Sound
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
}

export default YourTurnAlert;