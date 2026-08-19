import { useEffect, useRef, useState } from "react";
import {
  LogOut,
  Leaf,
  Sparkles,
  Route as RouteIcon,
  Car,
  Lock,
  Check,
  Crown,
  KeyRound,
  Camera,
  Trash2,
  X,
  User as UserIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAvatarUpload, useAvatarUrl } from "@/hooks/useAvatar";
import { VEHICLES, MALAV_FREE_CARS, DEFAULT_CAR_ID } from "@/lib/vehicles";
import { toast } from "sonner";
import { usePlan, PLAN_LABEL, PLAN_TAGLINE, normalizePlan } from "@/hooks/usePlan";

interface ProfileModalProps {
  onClose: () => void;
  onOpenScreen?: (screen: string) => void;
}

export default function ProfileModal({ onClose, onOpenScreen }: ProfileModalProps) {
  const planInfo = usePlan();
  const avatar = useAvatarUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>(null);
  const [tripCount, setTripCount] = useState(0);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  // Car specification states
  const [carModel, setCarModel] = useState("");
  const [carMileage, setCarMileage] = useState("");
  const [carFuelType, setCarFuelType] = useState("Petrol");
  const [carYear, setCarYear] = useState("");

  // Garage states
  const [unlockedTokens, setUnlockedTokens] = useState<string[]>([DEFAULT_CAR_ID]);
  const [selectedToken, setSelectedToken] = useState(DEFAULT_CAR_ID);

  // Membership plan
  const [membership, setMembership] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const avatarUrl = useAvatarUrl(avatarPath);

  async function loadProfile() {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return;

    const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    const { count } = await supabase
      .from("trips")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid);

    if (p) {
      setProfile(p);
      setFullName(p.full_name ?? "");
      setAvatarPath(p.avatar_url ?? null);
      setCarModel(p.car_model ?? "");
      setCarMileage(p.car_mileage ? String(p.car_mileage) : "");
      setCarFuelType(p.car_fuel_type ?? "Petrol");
      setCarYear(p.car_year ? String(p.car_year) : "");
      setSelectedToken(p.selected_token ?? DEFAULT_CAR_ID);

      const unlocked = Array.isArray(p.unlocked_tokens)
        ? (p.unlocked_tokens as string[])
        : [DEFAULT_CAR_ID];
      if (!unlocked.includes(DEFAULT_CAR_ID)) {
        unlocked.push(DEFAULT_CAR_ID);
      }

      const isMalav = p.full_name === "Malav Patel";
      if (isMalav) {
        let updated = false;
        MALAV_FREE_CARS.forEach((carId) => {
          if (!unlocked.includes(carId)) {
            unlocked.push(carId);
            updated = true;
          }
        });
        if (updated) {
          await supabase.from("profiles").update({ unlocked_tokens: unlocked }).eq("id", uid);
        }
      }

      setUnlockedTokens(unlocked);
    }
    setTripCount(count ?? 0);

    const { data: mp } = await supabase
      .from("membership_profiles")
      .select("membership")
      .eq("user_id", uid)
      .maybeSingle();
    setMembership(mp?.membership ?? null);

    if (normalizePlan(mp?.membership) === "max" && p) {
      const unlocked = Array.isArray(p.unlocked_tokens)
        ? [...(p.unlocked_tokens as string[])]
        : [DEFAULT_CAR_ID];
      let changed = false;
      VEHICLES.forEach((v) => {
        if (!unlocked.includes(v.id)) {
          unlocked.push(v.id);
          changed = true;
        }
      });
      if (changed) {
        await supabase.from("profiles").update({ unlocked_tokens: unlocked }).eq("id", uid);
        setUnlockedTokens(unlocked);
      }
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveChanges() {
    if (!profile) return;
    setSaving(true);

    const updates = {
      full_name: fullName,
      car_model: carModel || null,
      car_mileage: carMileage ? Number(carMileage) : null,
      car_fuel_type: carFuelType,
      car_year: carYear ? Number(carYear) : null,
    };

    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
    setSaving(false);

    if (error) {
      toast.error("Failed to save changes: " + error.message);
    } else {
      toast.success("Profile and car settings updated!");
      loadProfile();
    }
  }

  async function selectActiveToken(tokenId: string) {
    if (!profile) return;
    if (!unlockedTokens.includes(tokenId)) {
      toast.error("This token is locked. Collect it on routes to unlock!");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ selected_token: tokenId })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update selected token: " + error.message);
    } else {
      setSelectedToken(tokenId);
      toast.success("Active 3D map token updated!");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    if (onOpenScreen) onOpenScreen("auth");
    else onClose();
  }

  async function redeem() {
    const code = redeemCode.trim().toUpperCase();
    setRedeemError(null);
    setRedeemSuccess(null);
    if (!profile) return;
    if (!code) {
      setRedeemError("Enter a membership code to activate.");
      return;
    }
    if (code.length < 4) {
      setRedeemError("Codes are at least 4 characters.");
      return;
    }
    setRedeeming(true);
    const { data: found } = await supabase
      .from("memberships")
      .select("code, membership")
      .eq("code", code)
      .maybeSingle();

    if (!found) {
      setRedeeming(false);
      setRedeemError("Invalid code. Contact whysk.ai@outlook.com to request one.");
      toast.error("Invalid membership code");
      return;
    }

    const { error } = await supabase
      .from("membership_profiles")
      .upsert(
        { user_id: profile.id, membership: found.membership, code: found.code },
        { onConflict: "user_id" },
      );
    setRedeeming(false);
    if (error) {
      setRedeemError("Activation failed: " + error.message);
      toast.error("Activation failed");
    } else {
      setMembership(found.membership);
      setRedeemCode("");
      const label = PLAN_LABEL[normalizePlan(found.membership)];
      planInfo.refresh();
      loadProfile();
      setRedeemSuccess(`${label} plan activated successfully!`);
      toast.success(`${label} plan activated!`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md overflow-y-auto animate-scaleIn">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
            <UserIcon size={18} />
          </div>
          <span className="font-display font-bold text-lg">Profile & Garage</span>
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Profile"
          className="grid h-9 w-9 place-items-center rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 flex-1 w-full">
        {!profile ? (
          <div className="p-10 text-center text-muted-foreground">Loading profile details…</div>
        ) : (
          <>
            {/* Header Profile Info */}
            <div className="gradient-hero rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-eco">
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
              <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-4xl font-display font-bold overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${profile.full_name ?? "Your"} profile picture`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (profile.full_name ?? "V").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        try {
                          const result = await avatar.upload(file);
                          setAvatarPath(result.path);
                          toast.success("Profile picture updated");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Upload failed");
                        }
                      }}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={avatar.uploading}
                      aria-label="Upload profile picture"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                      <Camera size={14} /> {avatar.uploading ? "Uploading…" : "Change photo"}
                    </button>
                    {avatarPath && (
                      <button
                        onClick={async () => {
                          await avatar.remove();
                          setAvatarPath(null);
                          toast.success("Profile picture removed");
                        }}
                        aria-label="Remove profile picture"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/70 hover:text-white text-xs font-semibold transition cursor-pointer"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-white/60 text-sm">
                    Verden explorer since{" "}
                    {new Date(profile.created_at).toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">
                    {profile.full_name ?? "Anonymous"}
                  </h1>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <MiniStat
                  icon={<Leaf size={16} />}
                  label="CO₂ saved"
                  value={`${Number(profile.total_co2_saved).toFixed(1)} kg`}
                />
                <MiniStat
                  icon={<Sparkles size={16} />}
                  label="Credits"
                  value={profile.credits.toString()}
                />
                <MiniStat icon={<RouteIcon size={16} />} label="Trips" value={tripCount.toString()} />
              </div>
            </div>

            {/* Account Settings Section */}
            <div className="glass rounded-3xl p-6 md:p-8 space-y-6">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">Profile Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="displayName"
                    className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl border bg-card outline-none focus:border-primary text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Car Specifications Form */}
            <div className="glass rounded-3xl p-6 md:p-8 space-y-6">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Car size={22} className="text-primary" /> Car Specifications
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed -mt-3">
                Providing your vehicle specifications allows Verden Maps to compute exact, personalized
                CO₂ savings relative to standard baseline averages when you drive.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="carModel"
                    className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    Car Model
                  </label>
                  <input
                    id="carModel"
                    placeholder="e.g. Hatchback, SUV"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl border bg-card outline-none focus:border-primary text-sm font-medium"
                  />
                </div>
                <div>
                  <label
                    htmlFor="carMileage"
                    className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    Mileage (km/L)
                  </label>
                  <input
                    id="carMileage"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 15.2"
                    value={carMileage}
                    onChange={(e) => setCarMileage(e.target.value)}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl border bg-card outline-none focus:border-primary text-sm font-medium"
                  />
                </div>
                <div>
                  <label
                    htmlFor="carFuelType"
                    className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    Fuel Type
                  </label>
                  <select
                    id="carFuelType"
                    value={carFuelType}
                    onChange={(e) => setCarFuelType(e.target.value)}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl border bg-card outline-none focus:border-primary text-sm font-medium"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric / EV</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="carYear"
                    className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    Year (Optional)
                  </label>
                  <input
                    id="carYear"
                    type="number"
                    placeholder="e.g. 2024"
                    value={carYear}
                    onChange={(e) => setCarYear(e.target.value)}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl border bg-card outline-none focus:border-primary text-sm font-medium"
                  />
                </div>
              </div>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-6 py-3 rounded-xl gradient-eco text-white font-display font-semibold text-sm shadow-eco hover:scale-[1.01] active:scale-[0.99] transition duration-150 cursor-pointer"
              >
                {saving ? "Saving Changes…" : "Save Specifications"}
              </button>
            </div>

            {/* 3D Map Tokens Garage Grid */}
            <div className="glass rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <Sparkles size={20} className="text-primary animate-pulse" /> Vehicle Garage
                </h2>
                <span className="text-xs bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-bold">
                  {unlockedTokens.length} / {VEHICLES.length} Unlocked
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed -mt-3">
                Select which 3D model to load on the Verden map HUD. Unlock more vehicle tokens by
                gathering collectibles along scenic eco-routes or by completing quizzes.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {VEHICLES.map((vehicle) => {
                  const isUnlocked = unlockedTokens.includes(vehicle.id);
                  const isActive = selectedToken === vehicle.id;

                  return (
                    <button
                      key={vehicle.id}
                      disabled={!isUnlocked}
                      onClick={() => selectActiveToken(vehicle.id)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-36 transition-all duration-200 ${
                        isActive
                          ? "bg-emerald-500/10 border-emerald-500 shadow-md ring-1 ring-emerald-500"
                          : isUnlocked
                            ? "bg-card border-border hover:border-emerald-500/50 hover:bg-secondary/40 cursor-pointer"
                            : "bg-secondary/20 border-border/40 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <div
                          className={`p-2 rounded-xl ${isActive ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"}`}
                        >
                          <Car size={18} />
                        </div>
                        {isActive ? (
                          <span className="bg-emerald-500 text-white p-1 rounded-full">
                            <Check size={12} />
                          </span>
                        ) : !isUnlocked ? (
                          <Lock size={14} className="text-muted-foreground" />
                        ) : null}
                      </div>
                      <div className="mt-3">
                        <p className="font-display font-bold text-sm text-foreground">{vehicle.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {vehicle.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upgrade / Membership */}
            <div className="glass rounded-3xl p-6 md:p-8 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <Crown size={22} className="text-amber-500" /> Upgrade Plan
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    planInfo.isMax
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      : planInfo.isPro
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-secondary text-muted-foreground border-transparent"
                  }`}
                >
                  {PLAN_LABEL[planInfo.plan]} {planInfo.isPro && "Active"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <PlanCard
                  name={PLAN_LABEL.free}
                  active={planInfo.plan === "free"}
                  features={[
                    "Fastest & Eco route lenses",
                    "1 EcoMoov group",
                    "Explorer mood, 2 trips",
                  ]}
                  accent="muted"
                />
                <PlanCard
                  name={PLAN_LABEL.pro}
                  active={planInfo.plan === "pro"}
                  features={[
                    "+ Scenic & Battery lenses",
                    "Convoys, voice guidance",
                    "3 offline packs, all moods",
                    "Up to 5 groups, 10 trips",
                  ]}
                  accent="emerald"
                />
                <PlanCard
                  name={PLAN_LABEL.max}
                  active={planInfo.plan === "max"}
                  features={[
                    `Everything in ${PLAN_LABEL.pro}`,
                    "+ Sun & Shade lenses",
                    "12 offline packs, unlimited trips",
                    "Every garage vehicle unlocked",
                  ]}
                  accent="amber"
                />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                {PLAN_TAGLINE[planInfo.plan]} Enter your membership code to activate {PLAN_LABEL.pro} or{" "}
                {PLAN_LABEL.max}. Don't have one?{" "}
                <a href="mailto:whysk.ai@outlook.com" className="text-primary font-semibold underline">
                  Contact whysk.ai@outlook.com
                </a>{" "}
                to request a code.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-card focus-within:border-primary">
                  <KeyRound size={16} className="text-muted-foreground shrink-0" />
                  <input
                    aria-label="Membership code"
                    value={redeemCode}
                    onChange={(e) => {
                      setRedeemCode(e.target.value);
                      setRedeemError(null);
                      setRedeemSuccess(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") redeem();
                    }}
                    placeholder="Enter membership code"
                    className="flex-1 bg-transparent outline-none text-sm font-medium tracking-wide uppercase"
                  />
                </div>
                <button
                  onClick={redeem}
                  disabled={redeeming || !redeemCode.trim()}
                  className="px-6 py-3 rounded-xl gradient-eco text-white font-display font-semibold text-sm shadow-eco hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
                >
                  {redeeming ? "Activating…" : "Activate"}
                </button>
              </div>
              {redeemError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-2.5 text-xs font-semibold">
                  {redeemError}
                </div>
              )}
              {redeemSuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
                  <Check size={14} /> {redeemSuccess}
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={signOut}
              className="w-full py-3.5 rounded-2xl border border-destructive/20 text-destructive hover:bg-destructive/10 font-display font-semibold flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
            >
              <LogOut size={16} /> Sign out of Verden Maps
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass bg-white/10 border-white/10 rounded-2xl p-4 text-white">
      <div className="flex items-center gap-1.5 text-[10px] text-white/70 font-semibold uppercase tracking-wider">
        {icon} {label}
      </div>
      <p className="font-display text-lg md:text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function PlanCard({
  name,
  active,
  features,
  accent,
}: {
  name: string;
  active: boolean;
  features: string[];
  accent: "muted" | "emerald" | "amber";
}) {
  const ring =
    accent === "amber"
      ? "border-amber-500/50 bg-amber-500/5"
      : accent === "emerald"
        ? "border-emerald-500/50 bg-emerald-500/5"
        : "border-border bg-secondary/30";
  return (
    <div
      className={`rounded-2xl border p-4 ${active ? ring + " ring-2 ring-offset-0 " + (accent === "amber" ? "ring-amber-500/40" : accent === "emerald" ? "ring-emerald-500/40" : "ring-border") : "border-border/50 bg-card"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-display font-bold text-sm">{name}</p>
        {active && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
            <Check size={12} /> Current
          </span>
        )}
      </div>
      <ul className="space-y-1">
        {features.map((f) => (
          <li
            key={f}
            className="text-[11px] text-muted-foreground flex items-start gap-1.5 leading-snug"
          >
            <Check size={11} className="text-emerald-500 mt-0.5 shrink-0" /> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
