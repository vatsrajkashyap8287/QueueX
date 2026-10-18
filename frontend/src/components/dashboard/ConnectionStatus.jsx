import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { connectSocket } from "../../services/socket";

function ConnectionStatus() {
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const socket = connectSocket();

    if (!socket) {
      setStatus("disconnected");
      return;
    }

    setStatus(socket.connected ? "connected" : "reconnecting");

    const handleConnect = () => {
      setStatus("connected");
    };

    const handleDisconnect = () => {
      setStatus("reconnecting");
    };

    const handleConnectError = () => {
      setStatus("reconnecting");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  const retryConnection = () => {
    const socket = connectSocket();

    if (!socket) {
      setStatus("disconnected");
      return;
    }

    setStatus("reconnecting");

    if (!socket.connected) {
      socket.connect();
    }
  };

  const isConnected = status === "connected";
  const isReconnecting = status === "reconnecting";

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
        isConnected
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : isReconnecting
          ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
          : "border-red-500/20 bg-red-500/10 text-red-400"
      }`}
    >
      {isConnected ? (
        <Wifi size={16} />
      ) : isReconnecting ? (
        <RefreshCw size={16} className="animate-spin" />
      ) : (
        <WifiOff size={16} />
      )}

      <span>
        {isConnected
          ? "Live Connected"
          : isReconnecting
          ? "Reconnecting..."
          : "Disconnected"}
      </span>

      {!isConnected && (
        <button
          onClick={retryConnection}
          className="ml-2 rounded-md border border-current px-2 py-1 text-xs transition hover:bg-white/10"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ConnectionStatus;