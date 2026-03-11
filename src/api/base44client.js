async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
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
      }
    }
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        return { file_url: URL.createObjectURL(file) };
      }
    }
  }
};