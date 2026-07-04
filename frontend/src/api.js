const BASE_URL = "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request to ${path} failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // GET requests: user_id is passed in the URL query string
  getProfile: (userId) => request(`/profile?user_id=${userId}`),
  getSummary: (userId) => request(`/summary?user_id=${userId}`),
  
  // POST requests: user_id is bundled into the JSON body
  saveProfile: (userId, data) => request("/profile", { 
    method: "POST", 
    body: JSON.stringify({ user_id: userId, ...data }) 
  }),
  logFood: (userId, message) => request("/log-food", { 
    method: "POST", 
    body: JSON.stringify({ user_id: userId, message }) 
  }),
  logManual: (userId, data) => request("/log-manual", { 
    method: "POST", 
    body: JSON.stringify({ user_id: userId, ...data }) 
  }),
};