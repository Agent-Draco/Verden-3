import re

with open('src/routes/auth.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace('import { Leaf } from "lucide-react";', 'import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";')

# Add state
content = content.replace('const [loading, setLoading] = useState(false);', 'const [loading, setLoading] = useState(false);\n  const [showPassword, setShowPassword] = useState(false);')

# Replace password field
old_field = """          <Field label="Password">
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </Field>"""

new_field = """          <Field label="Password">
            <div className="relative">
              <input
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                style={{ paddingRight: "2.5rem" }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>"""
content = content.replace(old_field, new_field)

# Replace button
old_button = """          <button
            disabled={loading}
            className="w-full py-3 rounded-xl gradient-eco text-white font-display font-semibold shadow-eco disabled:opacity-50 hover:scale-[1.02] transition-transform"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>"""

new_button = """          <button
            disabled={loading}
            className="w-full py-3 rounded-xl gradient-eco text-white font-display font-semibold shadow-eco disabled:opacity-50 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>"""
content = content.replace(old_button, new_button)

with open('src/routes/auth.tsx', 'w') as f:
    f.write(content)
