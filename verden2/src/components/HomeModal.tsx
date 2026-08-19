import { useEffect, useState } from "react";
import {
  Leaf,
  TrendingUp,
  Route as RouteIcon,
  Users,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Radio,
  MailPlus,
  CheckCircle2,
  Copy,
  X,
  Home as HomeIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useConvoy } from "@/hooks/useConvoy";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface HomeModalProps {
  onClose: () => void;
  onOpenScreen?: (screen: string) => void;
}

export default function HomeModal({ onClose, onOpenScreen }: HomeModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trips, setTrips] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [groups, setGroups] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<Record<string, boolean>>({});
  const convoy = useConvoy();

  // Wave Zero Waitlist states
  const [waitlistEntry, setWaitlistEntry] = useState<Tables<"verden3_waitlist"> | null>(null);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [referralCount, setReferralCount] = useState<number>(0);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWaitlistStats = async (uid: string, entry: Tables<"verden3_waitlist"> | null) => {
    if (!entry) {
      setWaitlistEntry(null);
      setWaitlistPosition(null);
      setReferralCount(0);
      return;
    }
    setWaitlistEntry(entry);
    const { data: allWl } = await supabase
      .from("verden3_waitlist")
      .select("user_id, referred_by, created_at");

    if (allWl) {
      const refCounts: Record<string, number> = {};
      allWl.forEach((row) => {
        if (row.referred_by) {
          refCounts[row.referred_by] = (refCounts[row.referred_by] || 0) + 1;
        }
      });

      const userRefcount = refCounts[uid] || 0;
      setReferralCount(userRefcount);

      const entriesWithRefs = allWl.map((row) => ({
        ...row,
        referrals: refCounts[row.user_id || ""] || 0,
      }));

      const target = entriesWithRefs.find((row) => row.user_id === uid);
      if (target) {
        const targetTime = new Date(target.created_at).getTime();
        const rank =
          entriesWithRefs.filter((row) => {
            if (row.user_id === uid) return false;
            if (row.referrals > target.referrals) return true;
            if (row.referrals === target.referrals) {
              return new Date(row.created_at).getTime() < targetTime;
            }
            return false;
          }).length + 1;
        setWaitlistPosition(rank);
      }
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        toast.error("You must be logged in to join the waitlist.");
        return;
      }

      const referredBy = localStorage.getItem("verden3_referred_by") || null;

      const { data, error } = await supabase
        .from("verden3_waitlist")
        .insert({
          user_id: uid,
          email: emailInput,
          referred_by: referredBy,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Successfully joined the Wave Zero waitlist!");
      setWaitlistEntry(data);
      localStorage.removeItem("verden3_referred_by");
      await fetchWaitlistStats(uid, data);
    } catch (err: unknown) {
      toast.error("Error joining waitlist: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (
      !confirm("Are you sure you want to leave the waitlist? This will reset your queue position.")
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;

      const { error } = await supabase.from("verden3_waitlist").delete().eq("user_id", uid);

      if (error) throw error;

      toast.success("You have left the waitlist.");
      setWaitlistEntry(null);
      setWaitlistPosition(null);
      setReferralCount(0);
    } catch (err: unknown) {
      toast.error("Error leaving waitlist: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;

      const authEmail = userData.user?.email || "";
      setEmailInput(authEmail);

      const [{ data: p }, { data: t }, { data: g }, { data: m }, { data: wl }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase
          .from("trips")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("ecomoov_groups")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("group_members").select("group_id").eq("user_id", uid),
        supabase.from("verden3_waitlist").select("*").eq("user_id", uid).maybeSingle(),
      ]);

      setProfile(p);
      setTrips(t ?? []);

      const memberMap: Record<string, boolean> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m ?? []).forEach((r: any) => (memberMap[r.group_id] = true));
      setMemberships(memberMap);

      const sortedGroups = (g ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => {
          const joinedA = memberMap[a.id] ? 1 : 0;
          const joinedB = memberMap[b.id] ? 1 : 0;
          return joinedB - joinedA;
        })
        .slice(0, 3);

      setGroups(sortedGroups);

      if (wl) {
        await fetchWaitlistStats(uid, wl);
      }
    })();
  }, []);

  const totalCo2 = profile?.total_co2_saved ?? 0;
  const credits = profile?.credits ?? 0;
  const tripCount = trips.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md overflow-y-auto animate-scaleIn">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
            <HomeIcon size={18} />
          </div>
          <span className="font-display font-bold text-lg">Dashboard</span>
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Dashboard"
          className="grid h-9 w-9 place-items-center rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 flex-1 w-full">
        {/* CONVOY STATUS */}
        {!convoy.loading && (convoy.activeConvoy || convoy.myInvites.length > 0) && (
          <div className="glass rounded-3xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {convoy.activeConvoy ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                    <Radio size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-foreground">
                      {convoy.activeConvoy.coverEmoji} {convoy.activeConvoy.name} is live
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {
                        convoy.activeConvoy.members.filter(
                          (m) => m.status === "accepted" && m.sharingEnabled,
                        ).length
                      }{" "}
                      of {convoy.activeConvoy.members.filter((m) => m.status === "accepted").length}{" "}
                      members sharing location right now.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenScreen?.("convoy")}
                  className="px-4 py-2 gradient-eco text-white font-display font-bold text-xs rounded-xl shadow-eco transition cursor-pointer"
                >
                  Open convoy
                </button>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MailPlus size={20} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-foreground">
                      {convoy.myInvites.length} convoy invite
                      {convoy.myInvites.length === 1 ? "" : "s"} waiting
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Accept an invite to share your live position with the group.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenScreen?.("convoy")}
                  className="px-4 py-2 gradient-eco text-white font-display font-bold text-xs rounded-xl shadow-eco transition cursor-pointer"
                >
                  Review invites
                </button>
              </>
            )}
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              {greet()}, {profile?.full_name ?? "explorer"}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">Your impact today</h1>
          </div>
        </header>

        {/* Stat grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard
            icon={<Leaf size={22} />}
            label="CO₂ saved"
            value={`${totalCo2.toFixed(1)} kg`}
            hue="gradient-eco"
          />
          <StatCard
            icon={<Sparkles size={22} />}
            label="Credits earned"
            value={credits.toString()}
            hue="bg-accent text-accent-foreground"
          />
          <StatCard
            icon={<RouteIcon size={22} />}
            label="Trips logged"
            value={tripCount.toString()}
            hue="bg-secondary"
          />
        </div>

        {/* CTA card */}
        <button
          type="button"
          onClick={() => {
            if (onOpenScreen) onOpenScreen("map");
            else onClose();
          }}
          className="block w-full text-left group cursor-pointer"
        >
          <div className="gradient-hero rounded-3xl p-8 md:p-10 text-white shadow-eco relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
            <div className="relative">
              <p className="text-white/70 text-sm font-medium">Ready for a greener commute?</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 max-w-md">
                Find the most eco-friendly route.
              </h2>
              <div className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-foreground font-display font-semibold text-sm group-hover:scale-105 transition-transform">
                Open navigation <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </button>

        {/* Wave Zero Waitlist Section */}
        {!waitlistEntry ? (
          <div className="glass rounded-3xl p-6 md:p-8 border-2 border-primary/20 bg-linear-to-br from-primary/[0.03] via-background to-accent/[0.03] shadow-lg relative overflow-hidden group">
            <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
            <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-500" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold font-display tracking-wide uppercase">
                  <Sparkles size={12} className="animate-pulse" />
                  <span>Join Wave Zero</span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  Verden 3 is on the horizon
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Be the first to access next-gen AI-powered eco navigation, real-time community
                  dynamic rewards, and decentralized green verification. Secure your spot in Wave
                  Zero.
                </p>
              </div>

              <form
                onSubmit={handleJoinWaitlist}
                className="w-full md:w-auto shrink-0 md:max-w-md flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full h-12 px-4 rounded-xl border border-border bg-background/50 hover:border-muted-foreground/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-display font-semibold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Join Waitlist</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl p-6 md:p-8 border-2 border-emerald-500/20 bg-linear-to-br from-emerald-500/[0.03] via-background to-primary/[0.03] shadow-lg relative overflow-hidden group">
            <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-emerald-500/5 blur-3xl" />
            <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold font-display tracking-wide uppercase">
                    <CheckCircle2 size={12} />
                    <span>Secured Wave Zero Beta Access</span>
                  </div>
                  <h2 className="font-display text-xl md:text-2xl font-extrabold text-foreground">
                    You're on the list!
                  </h2>
                </div>
                <button
                  onClick={handleLeaveWaitlist}
                  disabled={isSubmitting}
                  className="text-xs text-muted-foreground hover:text-destructive font-semibold transition self-start sm:self-center cursor-pointer"
                >
                  Leave Waitlist
                </button>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="glass bg-background/40 rounded-2xl p-5 border border-border/40 hover:border-emerald-500/30 transition-all duration-300">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Your Queue Spot
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-display text-3xl font-black text-foreground">
                      #{waitlistPosition !== null ? waitlistPosition : "..."}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">in line</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Refer friends to move up in real time!
                  </p>
                </div>

                <div className="glass bg-background/40 rounded-2xl p-5 border border-border/40 hover:border-emerald-500/30 transition-all duration-300">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Successful Referrals
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-display text-3xl font-black text-foreground">
                      {referralCount}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {referralCount === 1 ? "friend" : "friends"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Each referral boosts your rank.
                  </p>
                </div>

                <div className="glass bg-background/40 rounded-2xl p-5 border border-border/40 hover:border-emerald-500/30 transition-all duration-300 sm:col-span-2 md:col-span-1">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Access Status
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-display text-lg font-bold text-foreground capitalize">
                      {waitlistEntry.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    We will email you at {waitlistEntry.email} when your invite is active.
                  </p>
                </div>
              </div>

              <div className="glass bg-background/30 rounded-2xl p-4 md:p-5 border border-border/40 space-y-3">
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground">
                    Invite Commuters & Skip the Queue
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Share your unique referral link. Whenever someone registers, you'll instantly move
                    ahead of others.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 bg-background/60 border border-border rounded-xl px-4 py-2.5 text-xs text-muted-foreground font-mono truncate select-all flex items-center">
                    {`https://verden2.lovable.app/?ref=${waitlistEntry.user_id}`}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `https://verden2.lovable.app/?ref=${waitlistEntry.user_id}`,
                      );
                      toast.success("Referral link copied to clipboard!");
                    }}
                    className="px-4 py-2.5 bg-foreground hover:bg-foreground/90 text-background rounded-xl font-display font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Copy size={14} />
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent trips */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold">Recent trips</h3>
            <TrendingUp size={18} className="text-primary" />
          </div>
          {trips.length === 0 ? (
            <div className="glass rounded-3xl p-8 text-center text-muted-foreground text-sm">
              No trips logged yet. Complete your first eco navigation to see it here.
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map((t) => (
                <div
                  key={t.id}
                  className="glass rounded-2xl p-4 flex items-center justify-between hover:border-primary/20 transition duration-200"
                >
                  <div>
                    <p className="font-display font-semibold text-sm text-foreground">
                      {t.destination_label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      from {t.origin_label} · {t.distance_km} km · {Math.round(t.duration_min)} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-display font-bold text-primary">
                      -{Number(t.co2_kg).toFixed(1)} kg CO₂
                    </p>
                    <p className="text-[10px] text-muted-foreground">+{t.credits_earned} credits</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* EcoMoov Groups */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold">EcoMoov groups</h3>
            <button
              type="button"
              onClick={() => onOpenScreen?.("ecomoov")}
              className="text-sm text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all <Users size={14} />
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="glass rounded-3xl p-8 text-center text-muted-foreground text-sm">
              No groups found. Form or join a group in the EcoMoov page.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-3">
              {groups.map((g) => {
                const isJoined = memberships[g.id];

                const cached = localStorage.getItem(`verden_group_chat_${g.id}`);
                let lastMessageHighlight = "";
                if (cached) {
                  const msgs = JSON.parse(cached);
                  if (msgs.length > 0) {
                    const last = msgs[msgs.length - 1];
                    lastMessageHighlight = `${last.sender}: "${last.text}"`;
                  }
                }

                return (
                  <div
                    key={g.id}
                    className={`glass rounded-3xl p-5 flex flex-col justify-between h-48 hover:border-primary/20 transition-all duration-200 ${
                      isJoined ? "border border-emerald-500/20 bg-emerald-500/[0.02]" : ""
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-eco ${
                            isJoined
                              ? "gradient-eco text-white"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          <Users size={18} />
                        </div>
                        {isJoined && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Active Carpool
                          </span>
                        )}
                      </div>

                      <p className="font-display font-bold text-sm text-foreground truncate">
                        {g.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                        {g.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/20">
                      {isJoined && lastMessageHighlight ? (
                        <p className="text-[9px] text-primary font-medium truncate flex items-center gap-1">
                          <MessageSquare size={10} className="shrink-0" />
                          {lastMessageHighlight}
                        </p>
                      ) : (
                        <p className="text-[9px] text-muted-foreground font-semibold">
                          Goal: {g.goal_co2_kg} kg CO₂
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hue: string;
}) {
  return (
    <div className="glass rounded-3xl p-5 hover:-translate-y-1 hover:shadow-eco transition-all duration-300 group">
      <div
        className={`w-11 h-11 rounded-xl ${hue} flex items-center justify-center text-white shadow-eco mb-3 group-hover:scale-105 transition-transform`}
      >
        {icon}
      </div>
      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
        {label}
      </p>
      <p className="font-display text-2xl md:text-3xl font-extrabold mt-1 text-foreground leading-none">
        {value}
      </p>
    </div>
  );
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
