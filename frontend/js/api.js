import { Auth } from "./auth.js";

const API_BASE_URL = "/api";

export async function apiFetch(endpoint, options = {}) {
    const token = Auth.getToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const response = await fetch(API_BASE_URL + path, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        Auth.logout();
        return response;
    }

    return response;
}