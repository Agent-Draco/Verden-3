// src/index.js
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes");
const { CONFIG } = require("./config");
const { handleToken } = require("./oauth"); // OAuth token endpoint

const app = express();
app.use(bodyParser.json());

function buildAuthorizeUrl(req) {
  const base = `${req.protocol}://${req.get("host")}`;
  const redirectUri = req.query.redirect_uri || `${base}/oauth/callback`;
  const authUrl = new URL("/oauth/authorize", base);
  authUrl.searchParams.set("client_id", req.query.client_id || base);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  if (req.query.state) authUrl.searchParams.set("state", req.query.state);
  if (req.query.code_challenge)
    authUrl.searchParams.set("code_challenge", req.query.code_challenge);
  if (req.query.code_challenge_method)
    authUrl.searchParams.set("code_challenge_method", req.query.code_challenge_method);
  return authUrl.toString();
}

// OAuth authorize/token exchange (no auth required)
app.get("/oauth/authorize", (req, res) => {
  const target = new URL("https://verden2.lovable.app/oauth/authorize");
  for (const [key, value] of Object.entries(req.query)) {
    if (Array.isArray(value)) value.forEach((v) => target.searchParams.append(key, v));
    else if (value !== undefined) target.searchParams.set(key, String(value));
  }
  res.redirect(target.toString());
});
app.post("/oauth/token", handleToken);

// Ensure Authorization header is present and forward token
app.use((req, res, next) => {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    const authorizationUrl = buildAuthorizeUrl(req);
    if (req.accepts("html")) return res.redirect(302, authorizationUrl);
    return res
      .status(401)
      .json({ error: "Authentication required", authorization_url: authorizationUrl });
  }
  req.token = auth.split(" ")[1];
  next();
});

// Health endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/", routes);

// Global error handler – always JSON error format
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ error: message });
});

const PORT = CONFIG.PORT;
app.listen(PORT, () => {
  console.log(`Verden MCP wrapper listening on port ${PORT}`);
});

module.exports = app;
