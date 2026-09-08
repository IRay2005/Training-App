import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "COACH" | "ATHLETE";
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      signIn: (nextToken, nextUser) => {
        setToken(nextToken);
        setUser(nextUser);
      },
      signOut: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
