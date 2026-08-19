import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/oauth/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const supabaseUrl = process.env.SUPABASE_URL;
          if (!supabaseUrl) {
            return Response.json({ error: "server_configuration_error" }, { status: 500 });
          }

          const contentLength = request.headers.get("content-length");
          if (contentLength && parseInt(contentLength, 10) > 10000) {
            return new Response(JSON.stringify({ error: "Payload Too Large" }), { status: 413 });
          }

          const contentType = request.headers.get("content-type") ?? "";
          const bodyText = await request.text();

          let incoming = bodyText;
          if (contentType.includes("application/json")) {
            try {
              incoming = JSON.stringify(JSON.parse(bodyText || "{}"));
            } catch (e) {
              return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
            }
          }

          const response = await fetch(
            `${supabaseUrl}/auth/v1/token?grant_type=authorization_code`,
            {
              method: "POST",
              headers: {
                "Content-Type": contentType.includes("application/json")
                  ? "application/json"
                  : "application/x-www-form-urlencoded",
              },
              body: incoming,
            },
          );

          if (!response.ok) {
            const text = await response.text();
            console.error("Upstream OAuth token error:", text);
            return new Response(JSON.stringify({ error: "Failed to exchange token" }), {
              status: response.status,
            });
          }

          const text = await response.text();
          return new Response(text, {
            status: response.status,
            headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
          });
        } catch (e) {
          console.error("Error in /oauth/token endpoint:", e);
          return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
        }
      },
    },
  },
});
