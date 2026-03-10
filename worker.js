export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/routes" && request.method === "GET") {
      const result = await env.DB.prepare(
        "SELECT id, name, grade, crag, created_at FROM routes ORDER BY id DESC"
      ).all();

      return Response.json({ ok: true, routes: result.results });
    }

    if (url.pathname === "/api/routes" && request.method === "POST") {
      const body = await request.json();
      const { name, grade, crag } = body;

      if (!name) {
        return Response.json(
          { ok: false, error: "name is required" },
          { status: 400 }
        );
      }

      await env.DB.prepare(
        "INSERT INTO routes (name, grade, crag) VALUES (?, ?, ?)"
      )
        .bind(name, grade ?? null, crag ?? null)
        .run();

      return Response.json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  },
};