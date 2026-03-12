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

function isValidUuid(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

// Only these paths are exempt from JWT auth
const PUBLIC_PATHS = ["/api/auth/signup", "/api/auth/login"];

// Base64url encoding/decoding for proper JWT format
function base64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH_ALGO = "SHA-256";
const PBKDF2_KEY_LENGTH = 32;

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const pbkdf2Buffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH_ALGO,
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  );
  return Array.from(new Uint8Array(pbkdf2Buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password, salt, hash) {
  const newHash = await hashPassword(password, salt);
  return newHash === hash;
}

async function generateJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(signingInput)
  );

  const signatureB64 = base64url(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  return `${signingInput}.${signatureB64}`;
}

async function verifyJwt(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = Uint8Array.from(base64urlDecode(signatureB64), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      enc.encode(signingInput)
    );

    if (!isValid) return null;

    return JSON.parse(base64urlDecode(payloadB64));
  } catch (e) {
    console.error("JWT verification failed:", e);
    return null;
  }
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // JWT Middleware
      // Public: /api/auth/signup, /api/auth/login
      // Public: /api/images/* (served as <img src> tags, no auth header possible)
      // Protected: everything else under /api/ including /api/auth/profile
      const isApiRoute = path.startsWith("/api/");
      const isPublicPath = PUBLIC_PATHS.includes(path);
      const isImagePath = path.startsWith("/api/images/");

      if (isApiRoute && !isPublicPath && !isImagePath) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return errorJson("Unauthorized", 401);
        }
        const token = authHeader.split(" ")[1];
        const user = await verifyJwt(token, env.JWT_SECRET);

        if (!user) {
          return errorJson("Unauthorized", 401);
        }

        request.user = user;

        if (request.method === "GET" || request.method === "DELETE") {
          url.searchParams.set("site_id", user.site_id);
        }
      }

      if (path === "/api/routes" && request.method === "GET") {
        const id = url.searchParams.get("id");
        const createdBy = url.searchParams.get("created_by");
        const published = url.searchParams.get("published");
        const siteId = request.user.site_id;
        const limit = Math.min(Number(url.searchParams.get("limit") || "100"), 500);

        let sql = "SELECT * FROM routes WHERE 1=1";
        const binds = [];

        if (id) { sql += " AND id = ?"; binds.push(id); }
        if (createdBy) { sql += " AND created_by = ?"; binds.push(createdBy); }
        if (published !== null) { sql += " AND published = ?"; binds.push(published === "true" ? 1 : 0); }
        if (siteId) { sql += " AND site_id = ?"; binds.push(siteId); }

        sql += " ORDER BY created_date DESC LIMIT ?";
        binds.push(limit);

        if (id && !isValidUuid(id)) return errorJson("Invalid route ID format", 400);
        if (siteId && !/^[a-zA-Z0-9_-]{3,}$/.test(siteId)) return errorJson("Invalid site ID format", 400);

        const result = await env.DB.prepare(sql).bind(...binds).all();
        return json((result.results || []).map(mapRoute));
      }

      if (path === "/api/routes" && request.method === "POST") {
        const body = await request.json();
        const now = new Date().toISOString();

        if (!body?.name || typeof body.name !== "string") {
          return errorJson("Route name is required", 400);
        }

        const siteId = request.user.site_id;
        if (!/^[a-zA-Z0-9_-]{3,}$/.test(siteId)) return errorJson("Invalid site ID format", 400);

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

        await env.DB.prepare(`
          INSERT INTO routes (
            id, name, grade, style, description, setter_name,
            wall_image_url, holds_json, published, created_by, created_date, site_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          route.id, route.name, route.grade, route.style, route.description,
          route.setter_name, route.wall_image_url, route.holds_json,
          route.published, route.created_by, route.created_date, route.site_id
        ).run();

        return json({ ...route, holds: JSON.parse(route.holds_json), published: !!route.published }, 201);
      }

      if (path.startsWith("/api/routes/") && request.method === "PUT") {
        const id = path.split("/").pop();
        const body = await request.json();

        if (!id || !isValidUuid(id)) return errorJson("Invalid route ID", 400);
        if (!body?.name || typeof body.name !== "string") return errorJson("Route name is required", 400);
        if (body.site_id && !/^[a-zA-Z0-9_-]{3,}$/.test(body.site_id)) return errorJson("Invalid site ID format", 400);

        const existing = await env.DB.prepare("SELECT * FROM routes WHERE id = ?").bind(id).first();
        if (!existing) return errorJson("Not found", 404);
        if (request.user.site_id !== existing.site_id) return errorJson("Cannot update route for different site", 403);

        await env.DB.prepare(`
          UPDATE routes SET name=?, grade=?, style=?, description=?, setter_name=?,
          wall_image_url=?, holds_json=?, published=? WHERE id=?
        `).bind(
          body.name, body.grade ?? null, body.style ?? null, body.description ?? null,
          body.setter_name ?? null, body.wall_image_url ?? null,
          JSON.stringify(body.holds || []), body.published ? 1 : 0, id
        ).run();

        const updated = await env.DB.prepare("SELECT * FROM routes WHERE id = ?").bind(id).first();
        if (!updated) return errorJson("Not found", 404);
        return json(mapRoute(updated));
      }

      if (path.startsWith("/api/routes/") && request.method === "DELETE") {
        const id = path.split("/").pop();

        if (!id || !isValidUuid(id)) return errorJson("Invalid route ID", 400);

        const existing = await env.DB.prepare("SELECT * FROM routes WHERE id = ?").bind(id).first();
        if (!existing) return errorJson("Not found", 404);
        if (request.user.site_id !== existing.site_id) return errorJson("Cannot delete route for different site", 403);

        const imageKey = getImageKeyFromUrl(existing.wall_image_url);
        await env.DB.prepare("DELETE FROM routes WHERE id = ?").bind(id).run();
        if (imageKey && env.ROUTE_IMAGES) await env.ROUTE_IMAGES.delete(imageKey);

        return json({ success: true });
      }

      if (path === "/api/upload" && request.method === "POST") {
        if (!env.ROUTE_IMAGES) return errorJson("R2 bucket binding ROUTE_IMAGES is not configured", 500);

        const formData = await request.formData();
        const file = formData.get("file");
        if (!(file instanceof File)) return errorJson("No file uploaded", 400);

        const safeName = sanitizeFilename(file.name || "upload.bin");
        const key = `routes/${crypto.randomUUID()}-${safeName}`;

        await env.ROUTE_IMAGES.put(key, await file.arrayBuffer(), {
          httpMetadata: { contentType: file.type || "application/octet-stream" }
        });

        return json({ file_key: key, file_url: `/api/images/${key}` }, 201);
      }

      if (path.startsWith("/api/images/") && request.method === "GET") {
        if (!env.ROUTE_IMAGES) return new Response("R2 bucket not configured", { status: 500 });

        const cache = caches.default;
        const cacheKey = new Request(request.url, request);
        const cached = await cache.match(cacheKey);
        if (cached) return cached;

        const key = decodeURIComponent(path.replace("/api/images/", ""));
        const object = await env.ROUTE_IMAGES.get(key);
        if (!object) return new Response("Not found", { status: 404 });

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("cache-control", "public, max-age=31536000, immutable");

        const response = new Response(object.body, { status: 200, headers });
        await cache.put(cacheKey, response.clone());
        return response;
      }

      if (path === "/api/auth/signup" && request.method === "POST") {
        const body = await request.json();
        const { username, password, site_id } = body;

        if (!username || !password || !site_id) {
          return errorJson("Username, password, and site ID are required", 400);
        }

        const existingUser = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
        if (existingUser) return errorJson("Username already exists", 409);

        const salt = crypto.randomUUID();
        const password_hash = `${salt}:${await hashPassword(password, salt)}`;

        const { success } = await env.DB.prepare(
          "INSERT INTO users (username, password_hash, site_id) VALUES (?, ?, ?)"
        ).bind(username, password_hash, site_id).run();

        if (!success) return errorJson("Failed to create user", 500);

        const user = await env.DB.prepare(
          "SELECT id, username, site_id FROM users WHERE username = ?"
        ).bind(username).first();

        const token = await generateJwt(
          { id: user.id, username: user.username, site_id: user.site_id },
          env.JWT_SECRET
        );
        return json({ token });
      }

      if (path === "/api/auth/login" && request.method === "POST") {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) return errorJson("Username and password are required", 400);

        const user = await env.DB.prepare(
          "SELECT id, username, password_hash, site_id FROM users WHERE username = ?"
        ).bind(username).first();

        if (!user) return errorJson("Invalid credentials", 401);

        const [salt, storedHash] = user.password_hash.split(":");
        if (!await verifyPassword(password, salt, storedHash)) return errorJson("Invalid credentials", 401);

        const token = await generateJwt(
          { id: user.id, username: user.username, site_id: user.site_id },
          env.JWT_SECRET
        );
        return json({ token });
      }

      // Protected by JWT middleware above — request.user is guaranteed here
      if (path === "/api/auth/profile" && request.method === "PUT") {
        const body = await request.json();
        const { site_id } = body;

        if (!site_id || !/^[a-zA-Z0-9_-]{3,}$/.test(site_id)) {
          return errorJson("Invalid site ID format", 400);
        }

        await env.DB.prepare(
          "UPDATE users SET site_id = ? WHERE id = ?"
        ).bind(site_id, request.user.id).run();

        const token = await generateJwt(
          { id: request.user.id, username: request.user.username, site_id },
          env.JWT_SECRET
        );
        return json({ token });
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error("Internal server error:", err);
      return errorJson("Internal server error", 500);
    }
  }
};