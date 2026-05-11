import { apiRequest } from "./client";

export async function getStatuses() {
  return await apiRequest("/statuses");
}

export async function createStatus(payload: Record<string, unknown>) {
  return await apiRequest("/statuses", {
    body: payload,
    method: "POST"
  });
}

export async function updateStatus(statusId: string, payload: Record<string, unknown>) {
  return await apiRequest(`/statuses/${statusId}`, {
    body: payload,
    method: "PATCH"
  });
}

export async function deleteStatus(statusId: string) {
  return await apiRequest(`/statuses/${statusId}`, {
    method: "DELETE"
  });
}
