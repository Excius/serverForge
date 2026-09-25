export const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api/v1`;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP Error ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (url: string) => fetchWithAuth(url),
  post: (url: string, data?: any) =>
    fetchWithAuth(url, { method: "POST", body: JSON.stringify(data) }),
  put: (url: string, data?: any) =>
    fetchWithAuth(url, { method: "PUT", body: JSON.stringify(data) }),
  patch: (url: string, data?: any) =>
    fetchWithAuth(url, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (url: string) => fetchWithAuth(url, { method: "DELETE" }),
};
