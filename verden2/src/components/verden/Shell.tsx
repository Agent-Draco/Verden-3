import {
  Home,
  Map,
  Route as RouteIcon,
  Users,
  User,
  Leaf,
  Shield,
  Settings,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
}

const nav: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "map", label: "Navigate", icon: Map },
  { id: "trips", label: "Trips", icon: RouteIcon },
  { id: "convoy", label: "Convoy", icon: Users },
  { id: "profile", label: "Profile", icon: User },
];

const themeOptions: Array<{ mode: ThemeMode; icon: typeof Sun; label: string }> = [
  { mode: "light", icon: Sun, label: "Light" },
  { mode: "dark", icon: Moon, label: "Dark" },
  { mode: "system", icon: Laptop, label: "System" },
];

function ThemeSwitch() {
  const { mode, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-1 rounded-full border border-border/60 p-1">
      {themeOptions.map((option) => (
        <button
          key={option.mode}
          type="button"
          aria-label={`${option.label} theme`}
          onClick={() => setTheme(option.mode)}
          className={`grid h-7 w-7 place-items-center rounded-full transition-colors cursor-pointer ${
            mode === option.mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <option.icon size={14} />
        </button>
      ))}
    </div>
  );
}

interface ShellProps {
  children: ReactNode;
  activeScreen?: string;
  onSelectScreen?: (screen: string) => void;
}

export function Shell({ children, activeScreen = "map", onSelectScreen }: ShellProps) {
  const handleNav = (screenId: string) => {
    if (onSelectScreen) onSelectScreen(screenId);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 p-6 glass border-r">
        <button
          type="button"
          onClick={() => handleNav("home")}
          className="flex items-center gap-2 mb-10 text-left cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl gradient-eco flex items-center justify-center shadow-eco group-hover:scale-105 transition-transform">
            <Leaf className="text-white" size={22} />
          </div>
          <span className="font-display font-bold text-xl text-foreground">Verden Maps</span>
        </button>

        <nav className="flex flex-col gap-1">
          {nav.map((n) => {
            const active = activeScreen === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleNav(n.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-display font-medium transition-all text-left cursor-pointer ${
                  active
                    ? "gradient-eco text-white shadow-eco"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <n.icon size={20} />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => handleNav("settings")}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 font-display font-medium transition-all text-left cursor-pointer ${
              activeScreen === "settings"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Settings size={20} />
            Settings
          </button>
          <div className="flex items-center justify-between px-1">
            <ThemeSwitch />
            <button
              type="button"
              onClick={() => handleNav("privacy")}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-primary cursor-pointer"
            >
              <Shield size={13} />
              Privacy
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 min-h-screen pb-20 md:pb-0 relative">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t px-2 py-2 flex justify-around">
        {nav.map((n) => {
          const active = activeScreen === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => handleNav(n.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition ${
                active ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <n.icon size={20} />
              {n.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
