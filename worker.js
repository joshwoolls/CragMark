function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function mapRoute(row) {
  return {
    ...row,
    holds: JSON.parse(row.holds_json || "[]"),
    published: !!row.published
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/routes" && request.method === "GET") {
      const id = url.searchParams.get("id");
      const createdBy = url.searchParams.get("created_by");
      const published = url.searchParams.get("published");
      const limit = Number(url.searchParams.get("limit") || "100");

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
      return json((result.results || []).map(mapRoute));
    }

    if (path === "/api/routes" && request.method === "POST") {
      const body = await request.json();
      const now = new Date().toISOString();

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
        created_date: now
      };

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

      return json({
        ...route,
        holds: JSON.parse(route.holds_json),
        published: !!route.published
      }, 201);
    }

    if (path.startsWith("/api/routes/") && request.method === "PUT") {
      const id = path.split("/").pop();
      const body = await request.json();

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

      if (!updated) return json({ error: "Not found" }, 404);
      return json(mapRoute(updated));
    }

    return env.ASSETS.fetch(request);
  }
};