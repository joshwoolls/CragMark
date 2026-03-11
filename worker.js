function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function errorJson(message, status = 500, extra = {}) {
  return json({ error: message, ...extra }, status);
}

function mapRoute(row) {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade,
    style: row.style,
    description: row.description,
    setter_name: row.setter_name,
    wall_image_url: row.wall_image_url,
    holds: JSON.parse(row.holds_json || "[]"),
    published: !!row.published,
    created_by: row.created_by,
    created_date: row.created_date,
    site_id: row.site_id
  };
}

function getImageKeyFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  const prefix = "/api/images/";
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}

function sanitizeFilename(name = "upload.bin") {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === "/api/routes" && request.method === "GET") {
        try {
          const id = url.searchParams.get("id");
          const createdBy = url.searchParams.get("created_by");
          const published = url.searchParams.get("published");
          const siteId = url.searchParams.get("site_id");
          const limit = Math.min(Number(url.searchParams.get("limit") || "100"), 500);

          console.log("GET /api/routes - params:", { id, createdBy, published, siteId, limit });

          let sql = "SELECT * FROM routes WHERE 1=1";
          const binds = [];

          if (id) {
            sql += " AND id = ?";
            binds.push(id);
          }
          if (createdBy) {
            sql += " AND created_by = ?";
            binds.push(createdBy);
          }
          if (published !== null) {
            sql += " AND published = ?";
            binds.push(published === "true" ? 1 : 0);
          }
          if (siteId) {
            sql += " AND site_id = ?";
            binds.push(siteId);
          }

          sql += " ORDER BY created_date DESC LIMIT ?";
          binds.push(limit);

          console.log("GET /api/routes - sql:", sql, "binds:", binds);

          const result = await env.DB.prepare(sql).bind(...binds).all();
          const routes = (result.results || []).map(mapRoute);
          console.log("GET /api/routes - returned", routes.length, "routes");
          return json(routes);
        } catch (err) {
          console.error("GET /api/routes error:", err);
          
          // If the error is about site_id column not existing, try without site_id filter
          if (err.message && (err.message.includes("site_id") || err.message.includes("no such column"))) {
            console.log("site_id column may not exist, retrying without site_id filter");
            // Re-run query without site_id filter
            const id = url.searchParams.get("id");
            const createdBy = url.searchParams.get("created_by");
            const published = url.searchParams.get("published");
            const limit = Math.min(Number(url.searchParams.get("limit") || "100"), 500);

            let sql = "SELECT * FROM routes WHERE 1=1";
            const binds = [];

            if (id) {
              sql += " AND id = ?";
              binds.push(id);
            }
            if (createdBy) {
              sql += " AND created_by = ?";
              binds.push(createdBy);
            }
            if (published !== null) {
              sql += " AND published = ?";
              binds.push(published === "true" ? 1 : 0);
            }

            sql += " ORDER BY created_date DESC LIMIT ?";
            binds.push(limit);

            const result = await env.DB.prepare(sql).bind(...binds).all();
            const routes = (result.results || []).map(mapRoute);
            console.log("GET /api/routes (fallback) - returned", routes.length, "routes");
            return json(routes);
          }
          
          return errorJson("Database query failed: " + err.message, 500);
        }
      }

      if (path === "/api/routes" && request.method === "POST") {
        const body = await request.json();
        const now = new Date().toISOString();

        console.log("POST /api/routes - body:", JSON.stringify(body, null, 2));

        if (!body?.name || typeof body.name !== "string") {
          return errorJson("Route name is required", 400);
        }

        // Use provided site_id or default to "default"
        const siteId = body.site_id || "default";

        const route = {
          id: crypto.randomUUID(),
          name: body.name,
          grade: body.grade ?? null,
          style: body.style ?? null,
          description: body.description ?? null,
          setter_name: body.setter_name ?? null,
          wall_image_url: body.wall_image_url ?? null,
          holds_json: JSON.stringify(body.holds || []),
          published: body.published ? 1 : 0,
          created_by: body.created_by || "user@localhost.local",
          created_date: now,
          site_id: siteId
        };

        console.log("Inserting route:", route);

        try {
          await env.DB.prepare(`
            INSERT INTO routes (
              id, name, grade, style, description, setter_name,
              wall_image_url, holds_json, published, created_by, created_date, site_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            route.id,
            route.name,
            route.grade,
            route.style,
            route.description,
            route.setter_name,
            route.wall_image_url,
            route.holds_json,
            route.published,
            route.created_by,
            route.created_date,
            route.site_id
          ).run();
        } catch (dbErr) {
          // If site_id column doesn't exist, try without it (backwards compatibility)
          console.error("Insert with site_id failed, trying without:", dbErr.message);
          await env.DB.prepare(`
            INSERT INTO routes (
              id, name, grade, style, description, setter_name,
              wall_image_url, holds_json, published, created_by, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            route.id,
            route.name,
            route.grade,
            route.style,
            route.description,
            route.setter_name,
            route.wall_image_url,
            route.holds_json,
            route.published,
            route.created_by,
            route.created_date
          ).run();
        }

        return json({
          ...route,
          holds: JSON.parse(route.holds_json),
          published: !!route.published
        }, 201);
      }

      if (path.startsWith("/api/routes/") && request.method === "PUT") {
        const id = path.split("/").pop();
        const body = await request.json();

        if (!id) {
          return errorJson("Route id is required", 400);
        }

        if (!body?.name || typeof body.name !== "string") {
          return errorJson("Route name is required", 400);
        }

        await env.DB.prepare(`
          UPDATE routes
          SET
            name = ?,
            grade = ?,
            style = ?,
            description = ?,
            setter_name = ?,
            wall_image_url = ?,
            holds_json = ?,
            published = ?
          WHERE id = ?
        `).bind(
          body.name,
          body.grade ?? null,
          body.style ?? null,
          body.description ?? null,
          body.setter_name ?? null,
          body.wall_image_url ?? null,
          JSON.stringify(body.holds || []),
          body.published ? 1 : 0,
          id
        ).run();

        const updated = await env.DB.prepare(
          "SELECT * FROM routes WHERE id = ?"
        ).bind(id).first();

        if (!updated) return errorJson("Not found", 404);
        return json(mapRoute(updated));
      }

      if (path.startsWith("/api/routes/") && request.method === "DELETE") {
        const id = path.split("/").pop();

        if (!id) {
          return errorJson("Route id is required", 400);
        }

        const existing = await env.DB.prepare(
          "SELECT * FROM routes WHERE id = ?"
        ).bind(id).first();

        if (!existing) {
          return errorJson("Not found", 404);
        }

        const imageKey = getImageKeyFromUrl(existing.wall_image_url);

        await env.DB.prepare("DELETE FROM routes WHERE id = ?").bind(id).run();

        if (imageKey && env.ROUTE_IMAGES) {
          await env.ROUTE_IMAGES.delete(imageKey);
        }

        return json({ success: true });
      }

      if (path === "/api/upload" && request.method === "POST") {
        if (!env.ROUTE_IMAGES) {
          return errorJson("R2 bucket binding ROUTE_IMAGES is not configured", 500);
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
          return errorJson("No file uploaded", 400);
        }

        const safeName = sanitizeFilename(file.name || "upload.bin");
        const key = `routes/${crypto.randomUUID()}-${safeName}`;

        await env.ROUTE_IMAGES.put(key, await file.arrayBuffer(), {
          httpMetadata: {
            contentType: file.type || "application/octet-stream"
          }
        });

        return json({
          file_key: key,
          file_url: `/api/images/${key}`
        }, 201);
      }

      if (path.startsWith("/api/images/") && request.method === "GET") {
        if (!env.ROUTE_IMAGES) {
          return new Response("R2 bucket not configured", { status: 500 });
        }

        const cache = caches.default;
        const cacheKey = new Request(request.url, request);
        const cached = await cache.match(cacheKey);
        if (cached) {
          return cached;
        }

        const key = decodeURIComponent(path.replace("/api/images/", ""));
        const object = await env.ROUTE_IMAGES.get(key);

        if (!object) {
          return new Response("Not found", { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("cache-control", "public, max-age=31536000, immutable");

        const response = new Response(object.body, {
          status: 200,
          headers
        });

        await cache.put(cacheKey, response.clone());
        return response;
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error(err);
      return errorJson("Internal server error", 500, {
        details: err?.message || String(err)
      });
    }
  }
};