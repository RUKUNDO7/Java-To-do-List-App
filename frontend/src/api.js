const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(message || `Request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const api = {
  signup: (payload) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => request("/auth/me"),
  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),
  dashboard: () => request("/dashboard"),
  list: () => request("/todos"),
  create: (payload) =>
    request("/todos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  byId: (id) => request(`/todos/${id}`),
  byTitle: (title) =>
    request(`/todos/title/${encodeURIComponent(title)}`),
  byStatus: (status) => request(`/todos/status/${status}`),
  updateById: (id, payload) =>
    request(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updateByTitle: (title, payload) =>
    request(`/todos/title/${encodeURIComponent(title)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteById: (id) =>
    request(`/todos/${id}`, {
      method: "DELETE",
    }),
  deleteByTitle: (title) =>
    request(`/todos/title/${encodeURIComponent(title)}`, {
      method: "DELETE",
    }),
};
