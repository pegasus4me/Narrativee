export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://www.api.narrativee.com"
    : "http://localhost:3002");

export const API_URL = `${API_BASE_URL}/api`;
