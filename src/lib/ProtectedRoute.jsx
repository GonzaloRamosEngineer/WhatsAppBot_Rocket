// C:\Projects\WhatsAppBot_Rocket\src\lib\ProtectedRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children, roles }) {
  const { session, profile, loading } = useAuth();

  console.log("[ProtectedRoute] render", { session, profile, loading, roles });

  if (loading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  // Sin sesión → a login
  if (!session) {
    console.log("[ProtectedRoute] no session → /login");
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles y el usuario no los tiene → fuera
  if (roles && !roles.includes(profile?.role)) {
    console.log("[ProtectedRoute] role not allowed", {
      have: profile?.role,
      needed: roles,
    });
    return <Navigate to="/" replace />;
  }

  return children;
}
