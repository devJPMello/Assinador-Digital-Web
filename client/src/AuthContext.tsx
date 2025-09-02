import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

export interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;   
  logout: () => void; 
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/me')
      .then(() => setAuth(true))
      .catch(() => setAuth(false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      loading,
      login: () => setAuth(true),
      logout: () => setAuth(false),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
