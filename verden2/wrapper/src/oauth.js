// src/oauth.js

const fetch = require("node-fetch");
const { CONFIG } = require("./config");

/**
 * Token exchange endpoint for local development.
 * Expects a POST body with the standard OAuth2 fields:
 *   - grant_type (must be "authorization_code")
 *   - code
 *   - redirect_uri
 *   - client_id
 *   - client_secret
 *
 * The request is forwarded to the production token endpoint
 * (https://verden2.lovable.app/oauth/token) and the response is
 * returned to the caller. This allows the wrapper to behave like the
 * production server when run locally on http://localhost:3000.
 */
async function handleToken(req, res) {
  const { grant_type, code, redirect_uri, client_id, client_secret } = req.body || {};

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ error: "Unsupported grant_type" });
  }
  if (!code || !redirect_uri || !client_id || !client_secret) {
    return res.status(400).json({ error: "Missing required OAuth fields" });
  }

  try {
    const response = await fetch("https://verden2.lovable.app/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type,
        code,
        redirect_uri,
        client_id,
        client_secret,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || "Token exchange failed" });
    }
    return res.json(data);
  } catch (e) {
    console.error("Token exchange error", e);
    return res.status(502).json({ error: "Token exchange service unavailable" });
  }
}

module.exports = { handleToken };
