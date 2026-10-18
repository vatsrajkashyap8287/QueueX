import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";

import "./App.css";

// ==========================================
// PROTECTED ROUTE
// ==========================================

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

          <p className="text-sm text-slate-400">
            Loading QueueX...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ==========================================
// DASHBOARD ROUTER
// ==========================================

function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}

// ==========================================
// APP
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        {/* GLOBAL TOAST NOTIFICATIONS */}

        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={12}
          containerStyle={{
            top: 88,
            right: 16,
            left: 16,
          }}
          toastOptions={{
            duration: 4000,

            style: {
              background: "#1e293b",
              color: "#f8fafc",
              border: "1px solid #334155",
              borderRadius: "14px",
              padding: "14px 16px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow:
                "0 10px 30px rgba(0, 0, 0, 0.25)",
              maxWidth: "420px",
            },

            success: {
              duration: 3500,
              iconTheme: {
                primary: "#22c55e",
                secondary: "#0f172a",
              },
            },

            error: {
              duration: 5000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#0f172a",
              },
            },

            loading: {
              duration: Infinity,
              iconTheme: {
                primary: "#38bdf8",
                secondary: "#0f172a",
              },
            },
          }}
        />

        {/* APPLICATION ROUTES */}

        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;