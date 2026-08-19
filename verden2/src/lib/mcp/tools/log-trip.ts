import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function supabaseForUser(ctx: ToolContext) {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "log_trip",
  title: "Log a trip",
  description: "Record a completed eco trip for the signed-in Verden user.",
  inputSchema: {
    origin_label: z.string().min(1),
    destination_label: z.string().min(1),
    origin_lat: z.number(),
    origin_lng: z.number(),
    dest_lat: z.number(),
    dest_lng: z.number(),
    distance_km: z.number().nonnegative(),
    duration_min: z.number().nonnegative(),
    co2_kg: z.number().nonnegative(),
    transport_mode: z.enum(["walk", "bike", "transit", "car", "ev"]).describe("Mode of transport."),
    route_type: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { route_type, ...rest } = input;
    const userId = ctx.getUserId();
    if (!userId) return { content: [{ type: "text", text: "No user id" }], isError: true };
    const { data, error } = await sb
      .from("trips")
      .insert({
        ...rest,
        route_type: route_type ?? "eco",
        user_id: userId,
        credits_earned: Math.round(input.co2_kg * 10),
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Trip logged (${data.id}).` }],
      structuredContent: { trip: data },
    };
  },
});
