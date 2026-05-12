import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface AuthUser {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  createdAt: string;
  plan?: "free" | "starter" | "pro" | "teams";
  provider?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refetch: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch { /**/ }
    setUser(null);
  };

  useEffect(() => { fetchMe(); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function getInitials(user: AuthUser | null): string {
  if (!user) return "?";
  const name = user.displayName || user.username;
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarColor(user: AuthUser | null): string {
  if (!user) return "#6e40c9";
  const colors = [
    "#f26207", "#e34c26", "#6e40c9", "#2563eb",
    "#059669", "#dc2626", "#7c3aed", "#0891b2",
  ];
  const idx = user.id % colors.length;
  return colors[idx];
}
