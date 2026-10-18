import { io } from "socket.io-client";

// ==========================================
// SOCKET CONFIGURATION
// ==========================================

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

// ==========================================
// CONNECT SOCKET
// ==========================================

export const connectSocket = () => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    console.warn("Socket connection skipped: JWT token missing");
    return null;
  }

  // Reuse existing Socket.IO instance.
  if (socket) {
    // Always refresh authentication token.
    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: false,

    auth: {
      token,
    },

    // Automatic reconnection
    reconnection: true,

    // Unlimited retry attempts
    reconnectionAttempts: Infinity,

    // Delay between reconnection attempts
    reconnectionDelay: 1000,

    // Maximum reconnection delay
    reconnectionDelayMax: 5000,

    // Connection timeout
    timeout: 10000,

    // Retry delay randomization
    randomizationFactor: 0.5,
  });

  // ========================================
  // SOCKET CONNECTED
  // ========================================

  socket.on("connect", () => {
    console.log("✅ QueueX Socket Connected:", socket.id);
  });

  // ========================================
  // SOCKET DISCONNECTED
  // ========================================

  socket.on("disconnect", (reason) => {
    console.warn("⚠️ QueueX Socket Disconnected:", reason);
  });

  // ========================================
  // CONNECTION ERROR
  // ========================================

  socket.on("connect_error", (error) => {
    console.error(
      "❌ QueueX Socket Connection Error:",
      error.message
    );
  });

  // ========================================
  // RECONNECTION ATTEMPT
  // ========================================

  socket.io.on("reconnect_attempt", (attempt) => {
    console.log(
      `🔄 QueueX reconnect attempt #${attempt}`
    );
  });

  // ========================================
  // RECONNECTION SUCCESS
  // ========================================

  socket.io.on("reconnect", (attempt) => {
    console.log(
      `✅ QueueX reconnected after ${attempt} attempt(s)`
    );
  });

  // ========================================
  // RECONNECTION FAILED
  // ========================================

  socket.io.on("reconnect_failed", () => {
    console.error(
      "❌ QueueX reconnection failed"
    );
  });

  // ========================================
  // START CONNECTION
  // ========================================

  socket.connect();

  return socket;
};

// ==========================================
// DISCONNECT SOCKET
// ==========================================

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();

    // Remove Socket.IO event listeners.
    socket.removeAllListeners();

    // Remove manager reconnection listeners.
    socket.io.removeAllListeners();

    socket = null;

    console.log("QueueX Socket disconnected manually");
  }
};