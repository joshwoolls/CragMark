class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  const token = localStorage.getItem("jwt_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Let the browser set multipart/form-data boundaries automatically for FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, {
    ...options,
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Not JSON, just use text
    }
    const error = new ApiError(res.status, `API ${res.status}: ${data?.error || text}`, data);
    if (res.status === 401) {
      // Handle unauthorized globally, e.g., redirect to login
      localStorage.removeItem("jwt_token");
      window.location.href = "/login"; // Redirect to login page
    }
    throw error;
  }

  return res.json();
}

export const base44 = {
  auth: {
    me: async () => {
      // This will now hit a protected endpoint, or we can create a /api/auth/me endpoint
      // For now, if a token exists, we assume authenticated
      const token = localStorage.getItem("jwt_token");
      if (token) {
        // In a real app, you'd verify the token with the backend
        // For this implementation, we'll just return a dummy user if token exists
        return { id: "authenticated-user", username: "authenticated", site_id: "from-token" };
      }
      throw new ApiError(401, "No token found");
    },
    login: async (username, password) => {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      localStorage.setItem("jwt_token", res.token);
      return res.token;
    },
    signup: async (username, password, site_id) => {
      const res = await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, password, site_id })
      });
      localStorage.setItem("jwt_token", res.token);
      return res.token;
    },
    logout: () => {
      localStorage.removeItem("jwt_token");
      window.location.href = "/login";
    },
    redirectToLogin: () => {
      window.location.href = "/login";
    }
  },

  entities: {
    Route: {
      filter: async (query = {}, sortBy, limit) => {
        const params = new URLSearchParams();
        if (query.id) params.set("id", query.id);
        if (query.created_by) params.set("created_by", query.created_by);
        if (query.site_id) params.set("site_id", query.site_id);
        if (query.published !== undefined) {
          params.set("published", String(query.published));
        }
        if (limit) params.set("limit", String(limit));
        if (sortBy) params.set("sortBy", sortBy);

        const url = `/api/routes?${params.toString()}`;
        console.log("base44.entities.Route.filter - url:", url, "query:", query);
        return api(url);
      },

      create: async (routeData) => {
        console.log("base44.entities.Route.create - data:", routeData);
        return api("/api/routes", {
          method: "POST",
          body: JSON.stringify(routeData)
        });
      },

      update: async (id, routeData) => {
        return api(`/api/routes/${id}`, {
          method: "PUT",
          body: JSON.stringify(routeData)
        });
      },

      delete: async (id, siteId) => {
        const params = new URLSearchParams();
        if (siteId) params.set("site_id", siteId);
        return api(`/api/routes/${id}?${params.toString()}`, {
          method: "DELETE"
        });
      }
    }
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return api("/api/upload", {
          method: "POST",
          body: formData
        });
      }
    }
  }
};