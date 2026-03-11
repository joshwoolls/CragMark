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