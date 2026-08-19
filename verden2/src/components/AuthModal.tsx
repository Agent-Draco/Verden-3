import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Eye, EyeOff, Loader2, X, Lock } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  onOpenScreen?: (screen: string) => void;
}

export default function AuthModal({ onClose, onSuccess, onOpenScreen }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created successfully!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
      if (onSuccess) onSuccess();
      else onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md overflow-y-auto animate-scaleIn">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
            <Lock size={18} />
          </div>
          <span className="font-display font-bold text-lg">Account</span>
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          className="grid h-9 w-9 place-items-center rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 grid md:grid-cols-2">
        <div className="hidden md:flex gradient-hero text-white p-12 flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <Leaf size={22} />
            </div>
            <span className="font-display font-bold text-xl">Verden Maps</span>
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight">
              Every trip is a
              <br />
              <span className="text-primary-glow">chance to do better.</span>
            </h2>
            <p className="mt-4 text-white/70 max-w-sm">
              Join thousands of Verden explorers cutting emissions one route at a time.
            </p>
          </div>
          <div className="text-xs text-white/50 flex items-center gap-3">
            <span>© Verden Maps</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => onOpenScreen?.("privacy")}
              className="hover:text-white transition underline cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8">
          <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 mx-auto">
            <div>
              <h1 className="font-display text-3xl font-bold">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "signin"
                  ? "Sign in to continue navigating greener."
                  : "Start tracking your eco impact today."}
              </p>
            </div>

            {mode === "signup" && (
              <Field label="Full name">
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Jane Green"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@earth.com"
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  required
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-eco text-white font-display font-semibold shadow-eco disabled:opacity-50 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            <p className="text-sm text-center text-muted-foreground">
              {mode === "signin" ? "New to Verden?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                {mode === "signin" ? "Create account" : "Sign in"}
              </button>
            </p>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => onOpenScreen?.("privacy")}
                className="text-xs text-muted-foreground hover:text-primary transition cursor-pointer"
              >
                By using Verden Maps, you agree to our{" "}
                <span className="underline font-medium">Privacy Policy</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
