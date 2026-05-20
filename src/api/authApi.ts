import { apiRequest } from "./client";
import { removeToken, saveToken } from "../storage/tokenStorage";

type AuthResponse = Record<string, unknown> & {
  accessToken?: string;
  data?: {
    accessToken?: string;
    token?: string;
  };
  needsName?: boolean;
  token?: string;
};

export function extractAuthToken(response: AuthResponse) {
  return response.token ?? response.accessToken ?? response.data?.token ?? response.data?.accessToken;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(emailOrPhone: string, password: string) {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    auth: false,
    body: { emailOrPhone, password },
    method: "POST"
  });

  const token = extractAuthToken(response);

  if (!token) {
    throw new Error("Login thành công nhưng response không có token");
  }

  await saveToken(token);

  return response;
}

// ─── Register (Step 1) ────────────────────────────────────────────────────────

export async function register(payload: Record<string, unknown>) {
  return await apiRequest<AuthResponse>("/auth/register", {
    auth: false,
    body: payload,
    method: "POST"
  });
}

// ─── Verify OTP (Step 2) ─────────────────────────────────────────────────────

export async function verifyOtp(emailOrPhone: string, otp: string) {
  const response = await apiRequest<AuthResponse>("/auth/verify-otp", {
    auth: false,
    body: { emailOrPhone, otp },
    method: "POST"
  });

  // Save the token so setup-name (Step 3) can attach it to its request
  const token = extractAuthToken(response);
  if (token) await saveToken(token);

  return response;
}

// ─── Setup Name (Step 3) ─────────────────────────────────────────────────────

export async function setupName(name: string) {
  // Uses the token already stored by verifyOtp
  const response = await apiRequest<AuthResponse>("/auth/setup-name", {
    auth: true,
    body: { name },
    method: "POST"
  });

  // Backend returns a fresh token after setup — persist it
  const token = extractAuthToken(response);
  if (token) await saveToken(token);

  return response;
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export async function resendOtp(emailOrPhone: string) {
  return await apiRequest("/auth/resend-otp", {
    auth: false,
    body: { emailOrPhone },
    method: "POST"
  });
}

// ─── Forgot Password ─────────────────────────────────────────────────────────

export async function forgotPassword(emailOrPhone: string) {
  return await apiRequest("/auth/forgot-password", {
    auth: false,
    body: { emailOrPhone },
    method: "POST"
  });
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(emailOrPhone: string, otp: string, newPassword: string) {
  return await apiRequest("/auth/reset-password", {
    auth: false,
    body: { emailOrPhone, otp, newPassword },
    method: "POST"
  });
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export async function loginWithGoogle(idToken: string) {
  const response = await apiRequest<AuthResponse>("/auth/google", {
    auth: false,
    body: { idToken },
    method: "POST"
  });

  const token = extractAuthToken(response);

  if (!token) {
    throw new Error("Google login thành công nhưng response không có token");
  }

  await saveToken(token);

  return response;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout() {
  await removeToken();
}
