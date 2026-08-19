// src/controllers.js
const { getMapping } = require("./config");
const mcpClient = require("./mcpClient");

function validate(body, required) {
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

function makeHandler(endpoint, requiredFields) {
  return async (req, res) => {
    const errMsg = validate(req.body, requiredFields);
    if (errMsg) {
      return res.status(400).json({ error: errMsg });
    }
    const mapping = getMapping();
    const toolName = mapping[endpoint];
    if (!toolName) {
      return res.status(500).json({ error: `MCP tool not configured for endpoint ${endpoint}` });
    }
    try {
      const result = await mcpClient.callTool(toolName, req.body, req.token);
      return res.json(result);
    } catch (e) {
      const status = e.status || 502;
      const message = e.message || "Backend error";
      return res.status(status).json({ error: message });
    }
  };
}

module.exports = {
  handleRoute: makeHandler("route", ["origin", "destination"]),
  handleSearch: makeHandler("search", ["query"]),
  handleGeocode: makeHandler("geocode", ["address"]),
  handleReverseGeocode: makeHandler("reverseGeocode", ["lat", "lng"]),
  handleNearby: makeHandler("nearby", ["lat", "lng", "radius"]),
  handlePlaceDetails: makeHandler("placeDetails", ["placeId"]),
};
