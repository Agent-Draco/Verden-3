import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { VEHICLES } from "@/lib/vehicles";

const VEHICLE_LIST = VEHICLES.map((v) => `"${v.name}"`).join(", ");
const NAME_TO_ID = new Map<string, string>();
VEHICLES.forEach((v) => {
  NAME_TO_ID.set(v.name.toLowerCase(), v.id);
  NAME_TO_ID.set(v.id.toLowerCase(), v.id);
  NAME_TO_ID.set(v.id.replace(/\.glb$/i, "").toLowerCase(), v.id);
});

function supabaseForUser(ctx: ToolContext) {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "unlock_car_with_quiz",
  title: "Unlock Car Token with Quiz",
  description:
    "Unlock a vehicle in the user's garage. To use this, you (the AI) MUST first ask the user this exact quiz question: " +
    "'Which transport mode has the lowest lifecycle emissions? A) Petrol, B) Diesel, C) Hybrid, D) Electric'. " +
    "If the user answers 'D' (or 'Electric'), call this tool with the requested car_name (using the vehicle's display name as shown in the garage, e.g. \"Future Race Car\", \"Luxury SUV\", \"Sports Sedan\") and quiz_answer = 'D'. " +
    `Available vehicles: ${VEHICLE_LIST}.`,
  inputSchema: {
    car_name: z
      .string()
      .describe(
        'The display name of the vehicle to unlock, exactly as shown in the user\'s garage (e.g., "Future Race Car", "Luxury SUV", "Hatchback").',
      ),
    quiz_answer: z
      .string()
      .describe("The user's answer to the quiz question (must be 'D' or 'Electric' to succeed)."),
  },
  handler: async ({ car_name, quiz_answer }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }

    const cleanAnswer = quiz_answer.trim().toUpperCase();
    const isCorrect = cleanAnswer === "D" || cleanAnswer.includes("ELECTRIC");

    if (!isCorrect) {
      return {
        content: [{ type: "text", text: "Incorrect quiz answer. The vehicle remains locked." }],
        isError: true,
      };
    }

    const car_id = NAME_TO_ID.get(car_name.trim().toLowerCase());
    if (!car_id) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown vehicle "${car_name}". Available vehicles: ${VEHICLE_LIST}.`,
          },
        ],
        isError: true,
      };
    }

    const sb = supabaseForUser(ctx);
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return {
        content: [{ type: "text", text: "User details could not be retrieved" }],
        isError: true,
      };
    }

    // Fetch user profile to read current unlocked tokens
    const { data: profile, error: getErr } = await sb
      .from("profiles")
      .select("unlocked_tokens")
      .eq("id", user.id)
      .maybeSingle();

    if (getErr || !profile) {
      return {
        content: [{ type: "text", text: getErr?.message ?? "Profile not found" }],
        isError: true,
      };
    }

    const unlocked = Array.isArray(profile.unlocked_tokens)
      ? (profile.unlocked_tokens as string[])
      : ["sedan.glb"];

    if (!unlocked.includes(car_id)) {
      unlocked.push(car_id);
    }

    const { error: updateErr } = await sb
      .from("profiles")
      .update({ unlocked_tokens: unlocked })
      .eq("id", user.id);

    if (updateErr) {
      return { content: [{ type: "text", text: updateErr.message }], isError: true };
    }

    const displayName = VEHICLES.find((v) => v.id === car_id)?.name ?? car_id;
    return {
      content: [{ type: "text", text: `Success! Unlocked "${displayName}" in the user's garage.` }],
      structuredContent: { success: true, car_name: displayName, unlocked_tokens: unlocked },
    };
  },
});
