import { useEffect, useState } from "react";
import { Users, Plus, Target, Leaf, Check, TrendingUp, Crown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";

interface EcoMoovModalProps {
  onClose: () => void;
  onOpenScreen?: (screen: string) => void;
}

type Group = {
  id: string;
  name: string;
  description: string | null;
  goal_co2_kg: number;
  owner_id: string;
  created_at: string;
};

type GroupStats = {
  memberCount: number;
  contributedCo2: number;
};

export default function EcoMoovModal({ onClose, onOpenScreen }: EcoMoovModalProps) {
  const plan = usePlan();
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<Record<string, GroupStats>>({});
  const [memberships, setMemberships] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", goal_co2_kg: 100 });
  const [uid, setUid] = useState<string | null>(null);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    setUid(u.user?.id ?? null);

    const { data: g } = await supabase
      .from("ecomoov_groups")
      .select("*")
      .order("created_at", { ascending: false });
    const groupList = (g ?? []) as Group[];
    setGroups(groupList);

    const { data: allMembers } = await supabase
      .from("group_members")
      .select("group_id, user_id, contributed_co2_kg");

    const statsMap: Record<string, GroupStats> = {};
    const membershipsMap: Record<string, boolean> = {};
    const currentUserId = u.user?.id;

    groupList.forEach((grp) => {
      statsMap[grp.id] = { memberCount: 0, contributedCo2: 0 };
    });

    if (allMembers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allMembers.forEach((m: any) => {
        if (statsMap[m.group_id]) {
          statsMap[m.group_id].memberCount += 1;
          statsMap[m.group_id].contributedCo2 += Number(m.contributed_co2_kg ?? 0);
        }

        if (currentUserId && m.user_id === currentUserId) {
          membershipsMap[m.group_id] = true;
        }
      });
    }

    setStats(statsMap);
    if (u.user) {
      setMemberships(membershipsMap);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function join(gid: string) {
    if (!uid) return;
    const { error } = await supabase.from("group_members").insert({ group_id: gid, user_id: uid });
    if (!error) {
      toast.success("Joined group!");
      load();
    } else {
      toast.error("Failed to join group: " + error.message);
    }
  }

  async function leave(gid: string) {
    if (!uid) return;
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", gid)
      .eq("user_id", uid);
    if (!error) {
      toast.success("Left group.");
      load();
    } else {
      toast.error("Failed to leave: " + error.message);
    }
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    const ownedCount = groups.filter((g) => g.owner_id === uid).length;
    if (!plan.unlimitedGroups && ownedCount >= plan.maxGroups) {
      toast.error(
        `Your ${plan.plan} plan allows ${plan.maxGroups} group${plan.maxGroups === 1 ? "" : "s"}. Upgrade in Profile to create more.`,
      );
      return;
    }
    const { data, error } = await supabase
      .from("ecomoov_groups")
      .insert({ ...form, owner_id: uid })
      .select()
      .single();

    if (!error && data) {
      await supabase.from("group_members").insert({ group_id: data.id, user_id: uid });
      setCreating(false);
      setForm({ name: "", description: "", goal_co2_kg: 100 });
      toast.success("Group created!");
      load();
    } else {
      toast.error("Failed to create group: " + (error?.message ?? "unknown error"));
    }
  }

  const joinedGroups = groups.filter((g) => memberships[g.id]);
  const otherGroups = groups.filter((g) => !memberships[g.id]);
  const ownedCount = groups.filter((g) => g.owner_id === uid).length;
  const canCreate = plan.unlimitedGroups || ownedCount < plan.maxGroups;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md overflow-y-auto animate-scaleIn">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
            <Users size={18} />
          </div>
          <span className="font-display font-bold text-lg">EcoMoov Groups</span>
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close EcoMoov"
          className="grid h-9 w-9 place-items-center rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 flex-1 w-full">
        <header className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium font-display">
              Community CO₂ Challenges
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">EcoMoov Groups</h1>
          </div>
          <button
            onClick={() => {
              if (!canCreate) {
                toast.error(
                  `Upgrade to Pro or Max to create more than ${plan.maxGroups} group${plan.maxGroups === 1 ? "" : "s"}.`,
                );
                return;
              }
              setCreating(!creating);
            }}
            className={`px-4 py-2.5 rounded-xl gradient-eco text-white font-display font-semibold text-sm shadow-eco flex items-center gap-2 hover:scale-105 transition cursor-pointer ${!canCreate ? "opacity-60" : ""}`}
          >
            {canCreate ? <Plus size={16} /> : <Crown size={16} />} New Group
          </button>
        </header>

        {!plan.unlimitedGroups && (
          <p className="text-xs text-muted-foreground">
            You've created <span className="font-bold text-foreground">{ownedCount}</span> of{" "}
            <span className="font-bold text-foreground">{plan.maxGroups}</span> groups allowed on the{" "}
            <span className="font-bold uppercase">{plan.plan}</span> plan.
            {!canCreate && (
              <button
                type="button"
                onClick={() => onOpenScreen?.("profile")}
                className="text-primary font-semibold underline ml-1 cursor-pointer"
              >
                Upgrade in Profile for more.
              </button>
            )}
          </p>
        )}

        {creating && (
          <form onSubmit={createGroup} className="glass rounded-3xl p-6 space-y-4 animate-scaleIn">
            <h3 className="font-display font-bold text-lg">Create Group</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                required
                placeholder="Group Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border bg-card outline-none focus:border-primary text-sm font-medium"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground shrink-0 font-medium">
                  CO₂ Target (kg):
                </label>
                <input
                  type="number"
                  min={10}
                  value={form.goal_co2_kg}
                  onChange={(e) => setForm({ ...form, goal_co2_kg: +e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border bg-card outline-none focus:border-primary text-sm font-medium"
                />
              </div>
            </div>
            <textarea
              placeholder="What's this group about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border bg-card outline-none focus:border-primary text-sm font-medium"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl gradient-eco text-white font-semibold text-sm shadow-eco cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        )}

        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2 text-primary">
            <Check size={20} className="text-emerald-500" /> Your Groups
          </h2>
          {joinedGroups.length === 0 ? (
            <div className="glass rounded-3xl p-8 text-center text-muted-foreground text-sm border border-dashed">
              You haven't joined any groups yet. Browse or create one below.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {joinedGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  stats={stats[g.id]}
                  joined
                  onLeave={() => leave(g.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 pt-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Users size={20} className="text-muted-foreground" /> Discover Groups
          </h2>
          {otherGroups.length === 0 ? (
            <div className="glass rounded-3xl p-8 text-center text-muted-foreground text-sm">
              No other groups yet. Create the first one!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {otherGroups.map((g) => (
                <GroupCard key={g.id} group={g} stats={stats[g.id]} onJoin={() => join(g.id)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  stats,
  joined,
  onJoin,
  onLeave,
}: {
  group: Group;
  stats?: GroupStats;
  joined?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}) {
  const contributed = stats?.contributedCo2 ?? 0;
  const members = stats?.memberCount ?? 0;
  const pct = Math.min(100, group.goal_co2_kg > 0 ? (contributed / group.goal_co2_kg) * 100 : 0);

  return (
    <div
      className={`glass rounded-3xl p-6 flex flex-col gap-4 ${joined ? "border border-emerald-500/20" : ""}`}
    >
      <div>
        <h3 className="font-display font-bold text-lg">{group.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {group.description || "No description."}
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users size={14} /> {members} member{members === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1">
          <Target size={14} /> Goal: {group.goal_co2_kg} kg
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingUp size={12} /> Progress
          </span>
          <span className="text-primary flex items-center gap-1">
            <Leaf size={12} /> {contributed.toFixed(1)} / {group.goal_co2_kg} kg
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full gradient-eco transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        {joined ? (
          <button
            onClick={onLeave}
            className="px-4 py-1.5 rounded-xl border border-border text-xs font-bold font-display hover:bg-secondary transition cursor-pointer"
          >
            Leave
          </button>
        ) : (
          <button
            onClick={onJoin}
            className="px-4 py-1.5 rounded-xl gradient-eco text-white text-xs font-bold font-display hover:scale-105 transition cursor-pointer"
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
}
