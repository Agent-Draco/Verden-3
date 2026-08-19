import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{
    data?: { client?: { name?: string }; redirect_url?: string; redirect_to?: string } | null;
    error?: { message: string } | null;
  }>;
  approveAuthorization: (id: string) => Promise<{
    data?: { redirect_url?: string; redirect_to?: string } | null;
    error?: { message: string } | null;
  }>;
  denyAuthorization: (id: string) => Promise<{
    data?: { redirect_url?: string; redirect_to?: string } | null;
    error?: { message: string } | null;
  }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
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
    // 1. Authenticate the user using existing Supabase auth session
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } as never });
    }

    // 2. If authorization_id is missing but standard OAuth client_id & redirect_uri are provided,
    // automatically redirect to Supabase Auth server to generate authorization_id
    if (!search.authorization_id && search.client_id && search.redirect_uri) {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      if (SUPABASE_URL) {
        const authUrl = new URL(`${SUPABASE_URL}/auth/v1/oauth/authorize`);
        authUrl.searchParams.set("client_id", search.client_id);
        authUrl.searchParams.set("redirect_uri", search.redirect_uri);
        authUrl.searchParams.set("response_type", search.response_type || "code");
        if (search.scope) authUrl.searchParams.set("scope", search.scope);
        if (search.state) authUrl.searchParams.set("state", search.state);
        if (search.code_challenge)
          authUrl.searchParams.set("code_challenge", search.code_challenge);
        if (search.code_challenge_method)
          authUrl.searchParams.set("code_challenge_method", search.code_challenge_method);

        throw redirect({ href: authUrl.toString() } as never);
      }
    }

    // 3. If neither authorization_id nor client_id is present, redirect to home safely
    if (!search.authorization_id && !search.client_id) {
      throw redirect({ to: "/home" } as never);
    }
  },
  loader: async ({ location }) => {
    const search = (location.search ?? {}) as { authorization_id?: string };
    if (!search.authorization_id) {
      return null;
    }
    const { data, error } = await oauthApi().getAuthorizationDetails(search.authorization_id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate } as never);
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-eco text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h1 className="font-display text-xl font-bold">Authorization Request Invalid</h1>
        <p className="text-sm text-muted-foreground">
          Could not load this authorization request: {String((error as Error)?.message ?? error)}
        </p>
        <div className="pt-2">
          <a
            href="#/home"
            className="inline-block py-2.5 px-6 rounded-xl gradient-eco text-white font-display font-semibold text-sm"
          >
            Return to Home
          </a>
        </div>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    if (!authorization_id) {
      setError("Missing authorization ID for decision.");
      return;
    }
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-eco">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center text-white">
            <Leaf size={20} />
          </div>
          <span className="font-display font-bold text-lg">Verden Maps</span>
        </div>
        <h1 className="font-display text-2xl font-bold">Connect {clientName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {clientName} will be able to use Verden Maps as you — reading your trips and logging new
          ones on your behalf.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 py-3 rounded-xl gradient-eco text-white font-display font-semibold disabled:opacity-50"
          >
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 py-3 rounded-xl border border-border font-display font-semibold disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      </div>
    </main>
  );
}
