import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../context/userContext";

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(UserContext);
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/user/dashboard"} replace />;
    }
    return <Outlet />;
  };

export default ProtectedRoute;