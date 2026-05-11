import { getToken } from "../storage/tokenStorage";

const API_BASE_URL = "https://personal-crm-backend-5uab.onrender.com/api";

type QueryValue = string | number | boolean | null | undefined;

type ApiRequestOptions = {
  auth?: boolean;
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  query?: Record<string, QueryValue>;
};

function buildQuery(params: Record<string, QueryValue> = {}) {
  const cleanParams = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");

  if (cleanParams.length === 0) return "";

  return `?${cleanParams
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&")}`;
}

function extractErrorMessage(data: unknown, status: number) {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const message = record.message ?? record.error;
    if (typeof message === "string") return message;
  }

  if (typeof data === "string" && data.trim().length > 0) return data;

  return `API error ${status}`;
}

export async function apiRequest<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, body, headers: customHeaders, method = "GET", query } = options;
  const token = auth ? await getToken() : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders
  };

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers,
    method
  });

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status));
  }

  return data as T;
}
