// src/mcpClient.js

const { CONFIG } = require("./config");

let toolCache = null; // cached array of tool names
let lastDiscovery = null;

const MCP_PROTOCOL_VERSION = "2025-06-18";

function mcpHeaders(authToken) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
    Authorization: `Bearer ${authToken}`,
  };
}

async function readMcpResponse(response) {
  const text = await response.text();
  if (!text) return {};
  if (!text.includes("\ndata:")) return JSON.parse(text);

  const events = text
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
  const lastJson = events.reverse().find((event) => event.startsWith("{"));
  return lastJson ? JSON.parse(lastJson) : {};
}

/** Discover tools using MCP JSON-RPC tools/list */
async function discoverTools(authToken) {
  const response = await fetch(CONFIG.MCP_BASE_URL, {
    method: "POST",
    headers: mcpHeaders(authToken),
    body: JSON.stringify({ jsonrpc: "2.0", id: "tools-list", method: "tools/list", params: {} }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw { status: response.status, message: `MCP discovery failed: ${txt}` };
  }

  const data = await readMcpResponse(response);
  const tools = data.result?.tools ?? data.tools;
  if (!tools || !Array.isArray(tools)) {
    throw { status: 502, message: "MCP discovery returned unexpected format" };
  }

  toolCache = tools.map((tool) => (typeof tool === "string" ? tool : tool.name));
  lastDiscovery = Date.now();
  return toolCache;
}

/** Call a tool via the official MCP "tools/call" command */
async function callTool(toolName, payload, authToken) {
  // Lazy discovery if cache missing
  if (!toolCache) {
    await discoverTools(authToken);
  }
  // If tool not present, refresh once
  if (!toolCache.includes(toolName)) {
    await discoverTools(authToken);
    if (!toolCache.includes(toolName)) {
      throw { status: 400, message: `Requested MCP tool "${toolName}" not available` };
    }
  }

  const response = await fetch(CONFIG.MCP_BASE_URL, {
    method: "POST",
    headers: mcpHeaders(authToken),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `tools-call-${Date.now()}`,
      method: "tools/call",
      params: { name: toolName, arguments: payload },
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw { status: response.status, message: `MCP call failed: ${txt}` };
  }

  const data = await readMcpResponse(response);
  if (data.error) {
    throw { status: data.error.code || 502, message: data.error.message || "MCP returned error" };
  }
  // Success: return the result field if present, otherwise the whole payload
  return data.result !== undefined ? data.result : data;
}

module.exports = {
  discoverTools,
  callTool,
};
