import axios from "axios";

// ==========================================
// API CONFIGURATION
// ==========================================

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export const SERVER_BASE_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,

  // Render Free instances may require
  // additional time during a cold start.
  timeout: 90000,
});

// ==========================================
// SERVER HEALTH CHECK
// ==========================================

export const checkServerHealth = async () => {
  const response = await axios.get(
    `${SERVER_BASE_URL}/`,
    {
      timeout: 90000,
    }
  );

  return response.data;
};

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// CENTRALIZED API ERROR HANDLING
// ==========================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    const backendMessage =
      error.response?.data?.message;

    let message = "";

    // ======================================
    // NETWORK / SERVER UNAVAILABLE
    // ======================================

    if (!error.response) {
      if (
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT"
      ) {
        message =
          "The server is taking longer than expected. Please try again.";
      } else {
        message =
          "Unable to connect to the server. Check your internet connection or try again later.";
      }
    }

    // ======================================
    // BACKEND RESPONSES
    // ======================================

    else if (
      typeof backendMessage === "string" &&
      backendMessage.trim()
    ) {
      message = backendMessage;
    } else {
      switch (status) {
        case 400:
          message =
            "Invalid request. Please check your details.";
          break;

        case 401:
          message =
            "Your session is invalid or expired. Please log in again.";
          break;

        case 403:
          message =
            "You do not have permission to perform this action.";
          break;

        case 404:
          message =
            "The requested resource was not found.";
          break;

        case 409:
          message =
            "This action conflicts with the current queue state.";
          break;

        case 429:
          message =
            "Too many requests. Please wait and try again.";
          break;

        case 500:
          message =
            "Server error. Please try again later.";
          break;

        case 502:
        case 503:
        case 504:
          message =
            "Service is temporarily unavailable. Please try again shortly.";
          break;

        default:
          message =
            "Something went wrong. Please try again.";
      }
    }

    error.userMessage = message;

    if (import.meta.env.DEV) {
      console.error("[QueueX API Error]", {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: status || "NETWORK_ERROR",
        message,
      });
    }

    return Promise.reject(error);
  }
);

export default api;