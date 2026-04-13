
export const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? "https://api.stackreach.com"
    : "http://localhost:3002";

export const API_URL = `${API_BASE_URL}/api`;
