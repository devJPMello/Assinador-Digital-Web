import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  return isAuthenticated ? children : <Navigate to="/register" replace />;
}
