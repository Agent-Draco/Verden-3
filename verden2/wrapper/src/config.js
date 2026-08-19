// src/config.js
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const CONFIG = {
  MCP_BASE_URL: process.env.MCP_BASE_URL || "https://verden2.lovable.app/mcp",
  MAPPING_PATH: process.env.MCP_MAPPING_PATH || path.resolve(__dirname, "..", "mcp-mapping.json"),
  PORT: process.env.PORT || 3000,
};

let endpointMapping = {};
try {
  const raw = fs.readFileSync(CONFIG.MAPPING_PATH, "utf8");
  endpointMapping = JSON.parse(raw);
} catch (e) {
  console.warn(`Mapping file not found at ${CONFIG.MAPPING_PATH}. Starting with empty mapping.`);
}

module.exports = {
  CONFIG,
  getMapping: () => endpointMapping,
  setMapping: (newMap) => {
    endpointMapping = newMap;
    fs.writeFileSync(CONFIG.MAPPING_PATH, JSON.stringify(endpointMapping, null, 2), "utf8");
  },
};
