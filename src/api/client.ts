import { getToken } from "../storage/tokenStorage";

const API_BASE_URL = "https://personal-crm-backend-5uab.onrender.com/api";
const DEBUG_API = true;

type QueryValue = string | number | boolean | null | undefined;

type ApiRequestOptions = {
  auth?: boolean;
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  query?: Record<string, QueryValue>;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  url: string;
  method: string;

  constructor({
    message,
    status,
    data,
    url,
    method,
  }: {
    message: string;
    status: number;
    data: unknown;
    url: string;
    method: string;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.url = url;
    this.method = method;
  }
}

function buildQuery(params: Record<string, QueryValue> = {}) {
  const cleanParams = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  if (cleanParams.length === 0) return "";

  return `?${cleanParams
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&")}`;
}

function extractErrorMessage(data: unknown, status: number) {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    const message =
      record.message ??
      record.error ??
      record.detail ??
      record.msg;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (Array.isArray(record.errors) && record.errors.length > 0) {
      return record.errors
        .map((item) => {
          if (typeof item === "string") return item;

          if (item && typeof item === "object") {
            const errorRecord = item as Record<string, unknown>;
            return errorRecord.message ?? errorRecord.msg ?? JSON.stringify(errorRecord);
          }

          return String(item);
        })
        .join("\n");
    }
  }

  if (typeof data === "string" && data.trim().length > 0) {
    return data;
  }

  return `API error ${status}`;
}

function safeBody(body: unknown) {
  if (!body || typeof body !== "object") return body;

  const clone = { ...(body as Record<string, unknown>) };

  if ("password" in clone) clone.password = "***";
  if ("confirmPassword" in clone) clone.confirmPassword = "***";
  if ("newPassword" in clone) clone.newPassword = "***";
  if ("currentPassword" in clone) clone.currentPassword = "***";

  return clone;
}

function safeHeaders(headers: Record<string, string>) {
  const clone = { ...headers };

  if (clone.Authorization) {
    clone.Authorization = "Bearer ***";
  }

  return clone;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    auth = true,
    body,
    headers: customHeaders,
    method = "GET",
    query,
  } = options;

  const token = auth ? await getToken() : null;
  const url = `${API_BASE_URL}${path}${buildQuery(query)}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (DEBUG_API) {
    console.log("API REQUEST:", {
      url,
      method,
      auth,
      hasToken: Boolean(token),
      headers: safeHeaders(headers),
      body: safeBody(body),
    });
  }

  let response: Response;

  try {
    response = await fetch(url, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers,
      method,
    });
  } catch (error) {
    console.log("API NETWORK ERROR:", {
      url,
      method,
      body: safeBody(body),
      error,
    });

    throw new Error("Không thể kết nối server. Kiểm tra mạng hoặc backend.");
  }

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (DEBUG_API) {
    console.log("API RESPONSE:", {
      url,
      method,
      status: response.status,
      ok: response.ok,
      data,
    });
  }

  if (!response.ok) {
    const message = extractErrorMessage(data, response.status);

    console.log("API ERROR:", {
      url,
      method,
      status: response.status,
      response: data,
      requestBody: safeBody(body),
    });

    throw new ApiError({
      message,
      status: response.status,
      data,
      url,
      method,
    });
  }

  return data as T;
}