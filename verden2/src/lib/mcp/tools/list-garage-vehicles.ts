import { defineTool } from "@lovable.dev/mcp-js";
import { VEHICLES } from "@/lib/vehicles";

export default defineTool({
  name: "list_garage_vehicles",
  title: "List garage vehicles",
  description: "List the actual vehicle names available in the Verden garage selector.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: VEHICLES.map((vehicle) => vehicle.name).join("\n") }],
    structuredContent: {
      vehicles: VEHICLES.map(({ name, description }) => ({ name, description })),
    },
  }),
});
