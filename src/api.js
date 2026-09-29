// src/api.js
// Centralized API configuration for the Quizzical client.
// Configurable via VITE_API_URL or defaults to Vite proxy (/api).

const BASE_URL = import.meta.env.VITE_API_URL || "/api";
const TIMEOUT_MS = 8000;

async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    clearTimeout(id);

    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch {
        // Fall back to status code
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error("Request timed out. The server took too long to respond.", { cause: err });
    }
    // Mask raw network connection errors with friendly message
    if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
      throw new Error("Unable to connect to the quiz server. Please make sure the backend is running.", { cause: err });
    }
    throw err;
  }
}

export async function checkServerHealth() {
  return request("/health");
}

export async function fetchCategories() {
  const data = await request("/categories");
  return data.categories || [];
}

export async function fetchQuestions({ category, difficulty, limit = 10 }) {
  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (difficulty && difficulty !== "All") params.set("difficulty", difficulty);
  if (limit) params.set("limit", limit);

  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/questions${query}`);
}

export async function checkAnswer({ questionId, selectedIndex, optionOrder }) {
  return request("/check", {
    method: "POST",
    body: JSON.stringify({
      questionId,
      selectedIndex,
      optionOrder,
    }),
  });
}

export async function submitAnswers(answers) {
  return request("/submit", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}