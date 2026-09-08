// EXPO_PUBLIC_ prefixed env vars are inlined at build time by Expo.
// Android emulator can't reach the host machine via "localhost" — it needs
// the special 10.0.2.2 alias. iOS simulator and web can use localhost directly.
import { Platform } from "react-native";

const DEFAULT_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${DEFAULT_HOST}:4000`;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
      "/auth/login",
      { method: "POST", body: { email, password } },
    ),
  registerCoach: (email: string, password: string, name: string) =>
    request<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
      "/auth/register-coach",
      { method: "POST", body: { email, password, name } },
    ),
  inviteAthlete: (token: string, email: string, password: string, name: string) =>
    request<{ user: { id: string; email: string; name: string }; athleteProfileId: string }>(
      "/auth/coach/invite-athlete",
      { method: "POST", token, body: { email, password, name } },
    ),
  me: (token: string) =>
    request<{ user: { id: string; email: string; name: string; role: string } | null }>("/auth/me", {
      token,
    }),
  coachDashboard: (token: string) =>
    request<{
      clients: Array<{
        athleteId: string;
        name: string;
        readiness: {
          score: number;
          color: "GREEN" | "AMBER" | "RED";
          confidenceTier: "HIGH" | "MODERATE" | "LOW";
          breakdown: { loadContribution: string; readinessContribution: string; confidenceContribution: string };
          note: string;
        };
        activePainOrRed: boolean;
      }>;
    }>("/coach/dashboard", { token }),
  todayReadiness: (token: string) =>
    request<{
      score: number;
      color: "GREEN" | "AMBER" | "RED";
      confidenceTier: "HIGH" | "MODERATE" | "LOW";
      breakdown: { loadContribution: string; readinessContribution: string; confidenceContribution: string };
      note: string;
    }>("/athletes/me/readiness/today", { token }),
  submitDailyEntry: (
    token: string,
    body: {
      sorenessFatigue: number;
      stress: number;
      moodMotivation: number;
      hasPain: boolean;
      painLocation?: string;
      painSeverity?: number;
      sleepSelfReport?: number;
    },
  ) => request("/athletes/me/daily-entry", { method: "POST", token, body }),
};
