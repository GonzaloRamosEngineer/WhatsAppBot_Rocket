import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children, roles }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="p-8">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(profile?.role)) return <Navigate to="/" replace />;
  return children;
}
