import { apiRequest } from "./client";

export async function getDashboard() {
  return await apiRequest("/dashboard");
}
