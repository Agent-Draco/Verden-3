// src/mcpClient.js
const fetch = require('node-fetch');
const { CONFIG } = require('./config');

let toolCache = null; // array of tool names
let lastDiscovery = null;

/**
 * Perform a "tools/list" request to discover available MCP tools.
 * The server returns an object with a "tools" array (according to the spec).
 */
async function discoverTools(authToken) {
  const response = await fetch(CONFIG.MCP_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ command: 'tools/list' }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw { status: response.status, message: `MCP discovery failed: ${txt}` };
  }

  const data = await response.json();
  // Expecting { tools: ["tool1", "tool2", ...] }
  if (!data.tools || !Array.isArray(data.tools)) {
    throw { status: 502, message: 'MCP discovery returned unexpected format' };
  }
  toolCache = data.tools;
  lastDiscovery = Date.now();
  return toolCache;
}

/**
 * Call a specific MCP tool using the official "tools/call" command.
 * If the tool is not present in the cache, we refresh the cache once.
 */
async function callTool(toolName, payload, authToken) {
  // Ensure we have a tool list; lazy discovery on first call
  if (!toolCache) {
    await discoverTools(authToken);
  }

  // If tool not in cache, refresh once more
  if (!toolCache.includes(toolName)) {
    await discoverTools(authToken);
    if (!toolCache.includes(toolName)) {
      throw { status: 400, message: `Requested MCP tool "${toolName}" not available` };
    }
  }

  const response = await fetch(CONFIG.MCP_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      command: 'tools/call',
      tool: toolName,
      payload: payload,
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw { status: response.status, message: `MCP call failed: ${txt}` };
  }

  const data = await response.json();
  // Expected MCP success response shape: { result: <object> }
  if (data.error) {
    // MCP may return an error object
    throw { status: 502, message: data.error.message || 'MCP returned error' };
  }
  return data.result !== undefined ? data.result : data;
}

module.exports = {
  discoverTools,
  callTool,
};
