/**
 * API Client for the Frontend-Only version.
 * This client handles requests to the external backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || "An error occurred", status: response.status };
    }

    return { data, status: response.status };
  } catch (error) {
    console.error("API Request Error:", error);
    return { error: "Network error or invalid JSON", status: 500 };
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),
    
  post: <T>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
    
  put: <T>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
    
  patch: <T>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
