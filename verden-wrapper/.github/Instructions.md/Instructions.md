# Instructions

## Overview
This repository provides an **OpenAPI 3.1 wrapper** around the Verden navigation backend using the native MCP protocol. The wrapper forwards a Bearer token obtained via Verden’s OAuth flow to the MCP server and translates simple REST calls into MCP tool invocations.

## Prerequisites
- **Node.js** (v18 or later) and **npm** installed.
- Access to the Verden MCP endpoint (`https://verden2.lovable.app/mcp`).
- An OAuth access token obtained from `https://verden2.lovable.app/oauth/consent` (ChatGPT will supply this when calling the wrapper).

## Installation
```bash
# Clone or copy the repository into a directory
cd /path/to/verden-wrapper
npm ci      # installs dependencies (express, node-fetch, dotenv)
```

Copy the example environment file and adjust if needed:
```bash
cp .env.example .env
# Edit .env to change the port or MCP base URL if required
```

## Configuration
- **MCP Mapping** – Define which MCP tool each REST endpoint should call in `mcp-mapping.json`. Example:
```json
{
  "route": "verden_route",
  "search": "verden_search",
  "geocode": "verden_geocode",
  "reverseGeocode": "verden_reverse_geocode",
  "nearby": "verden_nearby",
  "placeDetails": "verden_place_details"
}
```
- The mapping file is loaded at runtime; you can edit it without restarting the service (the wrapper will pick up changes on the next request).

## Running the Service
```bash
npm start   # starts on PORT from .env (default 3000)
```
You should see:
```
Verden wrapper listening on port 3000
```
The health endpoint can be checked:
```bash
curl http://localhost:3000/health
# => {"status":"ok"}
```

## API Endpoints
All POST endpoints require an `Authorization: Bearer <token>` header.
| Endpoint | Required JSON fields |
|----------|----------------------|
| `/route` | `origin`, `destination` |
| `/search` | `query` (optional `location`) |
| `/geocode` | `address` |
| `/reverse-geocode` | `lat`, `lng` |
| `/nearby` | `lat`, `lng`, `radius` |
| `/place-details` | `placeId` |

Responses are the raw `result` object returned by the MCP tool, wrapped in a JSON object.
Errors use the simple format `{ "error": "<message>" }` with appropriate HTTP status codes (401, 400, 502, 500).

## Importing into a ChatGPT Custom GPT Action
1. Open your Custom GPT configuration in ChatGPT.
2. Choose **Add API** → **Import OpenAPI**.
3. Upload the generated `openapi.json` file located in the repository root.
4. The endpoints will appear in the *Actions* list. When an Action is invoked, ChatGPT will automatically include the user’s OAuth token in the `Authorization` header, which the wrapper forwards to the MCP server.
5. Test an Action via the ChatGPT UI; you should receive the concise JSON payload defined by the MCP tool.

## Updating the Wrapper
- To add new endpoints or change validation rules, edit `src/controllers.js` and `src/routes.js`.
- To adjust MCP tool mapping, edit `mcp-mapping.json`.
- After changes, restart the service (`npm restart` or stop/start).

---
*Generated according to the user‑defined rule to keep a `.github/Instructions.md/Instructions.md` file.*
