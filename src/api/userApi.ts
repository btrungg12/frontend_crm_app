import { apiRequest } from "./client";

export type UpdateProfilePayload = {
  name?: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  expoPushToken?: string;
  [key: string]: unknown;
};

export async function getProfile() {
  return await apiRequest("/users/me");
}

export async function updateProfile(payload: UpdateProfilePayload) {
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
