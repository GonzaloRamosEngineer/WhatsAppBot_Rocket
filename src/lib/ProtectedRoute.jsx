// C:\Projects\WhatsAppBot_Rocket\src\lib\ProtectedRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children, roles }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  // Sin sesión → a login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles y el usuario no los tiene → fuera
  if (roles && !roles.includes(profile?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
