import { Moon, Sun, Laptop, X, Settings as SettingsIcon } from "lucide-react";
import { MAP_MOODS } from "@/lib/map/moods";
import { useUserSettings, EXPERIENCE_MODES } from "@/hooks/useUserSettings";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { usePlan, PLAN_LABEL } from "@/hooks/usePlan";
import { Switch } from "@/components/verden/Switch";

interface SettingsModalProps {
  onClose: () => void;
}

const THEMES: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "System", icon: Laptop },
];

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, update } = useUserSettings();
  const { mode, setTheme } = useTheme();
  const plan = usePlan();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md overflow-y-auto animate-scaleIn">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
            <SettingsIcon size={18} />
          </div>
          <span className="font-display font-bold text-lg">Settings</span>
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Settings"
          className="grid h-9 w-9 place-items-center rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-8 p-6 md:p-10 flex-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {PLAN_LABEL[plan.plan]} plan
            </p>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
              v3.2.8222026.2.7
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Settings</h1>
        </div>

        <section className="glass space-y-4 rounded-3xl p-5">
          <h2 className="font-display font-semibold">Appearance</h2>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.mode}
                type="button"
                onClick={() => setTheme(theme.mode)}
                className={`flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-xs font-semibold transition cursor-pointer ${
                  mode === theme.mode
                    ? "bg-primary/12 ring-2 ring-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <theme.icon size={18} />
                {theme.label}
              </button>
            ))}
          </div>
        </section>

        <section className="glass space-y-4 rounded-3xl p-5">
          <div>
            <h2 className="font-display font-semibold">Map mood</h2>
            <p className="text-xs text-muted-foreground">
              {plan.moods ? "Pick the atmosphere of your map." : `All moods unlock on ${PLAN_LABEL.pro}.`}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {MAP_MOODS.map((moodOption) => {
              const locked = !plan.moods && moodOption.id !== "explorer";
              return (
                <button
                  key={moodOption.id}
                  type="button"
                  disabled={locked}
                  onClick={() => void update({ mapMood: moodOption.id })}
                  className={`flex items-start gap-3 rounded-2xl p-3 text-left transition disabled:opacity-40 cursor-pointer ${
                    settings.mapMood === moodOption.id
                      ? "bg-primary/12 ring-2 ring-primary"
                      : "bg-secondary"
                  }`}
                >
                  <span className="text-xl">{moodOption.emoji}</span>
                  <span>
                    <span className="block font-display text-sm font-semibold">
                      {moodOption.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {moodOption.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="glass space-y-4 rounded-3xl p-5">
          <h2 className="font-display font-semibold">Experience mode</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {EXPERIENCE_MODES.map((experience) => (
              <button
                key={experience.id}
                type="button"
                onClick={() => void update({ experienceMode: experience.id })}
                className={`rounded-2xl p-3 text-left transition cursor-pointer ${
                  settings.experienceMode === experience.id
                    ? "bg-primary/12 ring-2 ring-primary"
                    : "bg-secondary"
                }`}
              >
                <span className="text-xl">{experience.emoji}</span>
                <span className="mt-1 block font-display text-sm font-semibold">
                  {experience.name}
                </span>
                <span className="block text-xs text-muted-foreground">{experience.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="glass divide-y divide-border/60 rounded-3xl p-5">
          <h2 className="pb-3 font-display font-semibold">Navigation, privacy & access</h2>
          <Row
            title="Voice guidance"
            hint={plan.voiceGuidance ? "Spoken turn-by-turn." : `Unlocks on ${PLAN_LABEL.pro}.`}
            checked={settings.voiceGuidance}
            disabled={!plan.voiceGuidance}
            onChange={(v) => void update({ voiceGuidance: v })}
          />
          <Row
            title="Share my location in convoys"
            hint="Turn off to stay invisible to convoy members."
            checked={settings.shareLocation}
            onChange={(v) => void update({ shareLocation: v })}
          />
          <Row
            title="Reduce motion"
            hint="Calmer transitions and camera moves."
            checked={settings.reduceMotion}
            onChange={(v) => void update({ reduceMotion: v })}
          />
          <Row
            title="Larger text"
            hint="Increases type size across the app."
            checked={settings.largeText}
            onChange={(v) => void update({ largeText: v })}
          />
          <Row
            title="Convoy notifications"
            hint="Invites, arrivals and alerts."
            checked={settings.notifyConvoy}
            onChange={(v) => void update({ notifyConvoy: v })}
          />
        </section>
      </div>
    </div>
  );
}

function Row(props: {
  title: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{props.title}</p>
        <p className="text-xs text-muted-foreground">{props.hint}</p>
      </div>
      <Switch
        checked={props.checked}
        {...(props.disabled ? { disabled: true } : {})}
        label={props.title}
        onChange={props.onChange}
      />
    </div>
  );
}
