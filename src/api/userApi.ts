import { apiRequest } from "./client";

export async function getProfile() {
  return await apiRequest("/users/me");
}

export async function updateProfile(payload: Record<string, unknown>) {
  return await apiRequest("/users/me", {
    body: payload,
    method: "PATCH"
  });
}

export async function changePassword(payload: Record<string, unknown>) {
  return await apiRequest("/users/change-password", {
    body: payload,
    method: "PATCH"
  });
}
