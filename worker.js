export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === "/api/test-db") {
      try {
        const row = await env.DB.prepare(
          "SELECT datetime('now') as now"
        ).first()

        return Response.json({ ok: true, row })
      } catch (err) {
        return Response.json(
          { ok: false, error: String(err) },
          { status: 500 }
        )
      }
    }

    return new Response("Worker is running", { status: 200 })
  },
}