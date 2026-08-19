import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/oauth/authorize")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    client_id: typeof s.client_id === "string" ? s.client_id : "",
    redirect_uri: typeof s.redirect_uri === "string" ? s.redirect_uri : "",
    response_type: typeof s.response_type === "string" ? s.response_type : "",
    scope: typeof s.scope === "string" ? s.scope : "",
    state: typeof s.state === "string" ? s.state : undefined,
    code_challenge: typeof s.code_challenge === "string" ? s.code_challenge : undefined,
    code_challenge_method:
      typeof s.code_challenge_method === "string" ? s.code_challenge_method : undefined,
  }),
  beforeLoad: async ({ search, location }) => {
    // 1. Validate standard OAuth 2.0 query parameters
    if (!search.client_id) {
      throw new Error("Invalid OAuth request: Missing required parameter 'client_id'.");
    }
    if (!search.redirect_uri) {
      throw new Error("Invalid OAuth request: Missing required parameter 'redirect_uri'.");
    }
    if (search.response_type !== "code") {
      throw new Error(
        `Invalid OAuth request: Unsupported response_type '${search.response_type || "none"}'. Only 'code' is supported.`,
      );
    }

    // 2. Authenticate the user using existing Supabase auth session
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } as never });
    }

    // 3. Construct Supabase Auth server authorization endpoint URL
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!SUPABASE_URL) {
      throw new Error("Missing SUPABASE_URL configuration variable.");
    }

    const authUrl = new URL(`${SUPABASE_URL}/auth/v1/oauth/authorize`);
    authUrl.searchParams.set("client_id", search.client_id);
    authUrl.searchParams.set("redirect_uri", search.redirect_uri);
    authUrl.searchParams.set("response_type", search.response_type || "code");
    if (search.scope) authUrl.searchParams.set("scope", search.scope);
    if (search.state) authUrl.searchParams.set("state", search.state);
    if (search.code_challenge) authUrl.searchParams.set("code_challenge", search.code_challenge);
    if (search.code_challenge_method)
      authUrl.searchParams.set("code_challenge_method", search.code_challenge_method);

    // Redirect browser directly to Supabase Auth authorization server.
    // Supabase Auth server creates the authorization request in DB, generates authorization_id,
    // and redirects browser to /oauth/consent?authorization_id=<generated-id>
    throw redirect({ href: authUrl.toString() } as never);
  },
  component: AuthorizeHandler,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-eco text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h1 className="font-display text-xl font-bold">OAuth Authorization Error</h1>
        <p className="text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function AuthorizeHandler() {
  const search = Route.useSearch();

  useEffect(() => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!SUPABASE_URL) return;

    const authUrl = new URL(`${SUPABASE_URL}/auth/v1/oauth/authorize`);
    authUrl.searchParams.set("client_id", search.client_id);
    authUrl.searchParams.set("redirect_uri", search.redirect_uri);
    authUrl.searchParams.set("response_type", search.response_type || "code");
    if (search.scope) authUrl.searchParams.set("scope", search.scope);
    if (search.state) authUrl.searchParams.set("state", search.state);
    if (search.code_challenge) authUrl.searchParams.set("code_challenge", search.code_challenge);
    if (search.code_challenge_method)
      authUrl.searchParams.set("code_challenge_method", search.code_challenge_method);

    window.location.href = authUrl.toString();
  }, [search]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-eco text-center space-y-4">
        <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center text-white mx-auto animate-spin">
          <RefreshCw size={20} />
        </div>
        <h1 className="font-display text-lg font-bold">Redirecting to Authorization…</h1>
        <p className="text-sm text-muted-foreground">Preparing your OAuth consent request.</p>
      </div>
    </main>
  );
}
