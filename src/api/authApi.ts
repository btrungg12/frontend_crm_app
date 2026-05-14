import { apiRequest } from "./client";
import { removeToken, saveToken } from "../storage/tokenStorage";

type AuthResponse = Record<string, unknown> & {
  accessToken?: string;
  data?: {
    accessToken?: string;
    token?: string;
  };
  token?: string;
};

export function extractAuthToken(response: AuthResponse) {
  return response.token ?? response.accessToken ?? response.data?.token ?? response.data?.accessToken;
}

export async function register(payload: Record<string, unknown>) {
  return await apiRequest<AuthResponse>("/auth/register", {
    auth: false,
    body: payload,
    method: "POST"
  });
}

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

export async function logout() {
  await removeToken();
}
