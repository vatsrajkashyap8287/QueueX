import axios from "axios";

// ==========================================
// API CONFIGURATION
// ==========================================

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  timeout: 15000,
});

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
    // Request cancelled by browser / AbortController.
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
      if (error.code === "ECONNABORTED") {
        message =
          "Request timed out. Please try again.";
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
      // Preserve useful backend messages.
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

    // Preserve original Axios error details while
    // exposing a consistent message to components.
    error.userMessage = message;

    // Useful during development.
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