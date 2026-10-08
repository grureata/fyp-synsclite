const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiRequestError("The backend could not be reached.", 0);
  }

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiRequestError("The backend returned an invalid response.", response.status);
  }

  if (!payload || typeof payload !== "object" || typeof payload.success !== "boolean") {
    throw new ApiRequestError("The backend returned an unexpected response.", response.status);
  }
  if (!response.ok || !payload.success) {
    throw new ApiRequestError(payload.message || "The request failed.", response.status);
  }
  if (!("data" in payload)) {
    throw new ApiRequestError("The backend response is missing data.", response.status);
  }

  return payload.data;
}

export type User = {
  id: string;
  username: string;
  email: string;
  role: "DEAF_USER" | "HEARING_USER" | "ADMIN";
};
