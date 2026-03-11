async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };

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
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json();
}

export const base44 = {
  auth: {
    me: async () => {
      return {
        id: "local-user-1",
        email: "user@localhost.local",
        name: "Local User"
      };
    },
    logout: async () => {},
    redirectToLogin: () => {
      console.log("Redirect to login (no-op for now)");
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

        return api(`/api/routes?${params.toString()}`);
      },

      create: async (routeData) => {
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

      delete: async (id) => {
        return api(`/api/routes/${id}`, {
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