// src/config.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const CONFIG = {
  // Base URL for the MCP server
  MCP_BASE_URL: process.env.MCP_BASE_URL || 'https://verden2.lovable.app/mcp',

  // Path to the mapping JSON file (default in project root)
  MAPPING_PATH: process.env.MCP_MAPPING_PATH || path.resolve(__dirname, '..', 'mcp-mapping.json'),

  // Server listening port
  PORT: process.env.PORT || 3000,
};

// Load the endpoint‑to‑MCP‑tool mapping (JSON file). If the file does not exist, start with empty mapping.
let endpointMapping = {};
try {
  const raw = fs.readFileSync(CONFIG.MAPPING_PATH, 'utf8');
  endpointMapping = JSON.parse(raw);
} catch (e) {
  console.warn(`Mapping file not found at ${CONFIG.MAPPING_PATH}. Starting with empty mapping.`);
}

module.exports = {
  CONFIG,
  getMapping: () => endpointMapping,
  setMapping: (newMap) => {
    endpointMapping = newMap;
    fs.writeFileSync(CONFIG.MAPPING_PATH, JSON.stringify(endpointMapping, null, 2), 'utf8');
  },
};
