import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <h1>QueueX Dashboard</h1>

      <h2>Welcome, {user?.name}!</h2>

      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>

      <button onClick={handleLogout}>
        Logout
      </button>

      <hr />

      <h3>Smart Virtual Queue Management</h3>

      <p>
        Queue management features coming soon.
      </p>
    </div>
  );
}

export default Dashboard;