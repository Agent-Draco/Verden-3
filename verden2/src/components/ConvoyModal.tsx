import { useState } from "react";
import {
  Users,
  Plus,
  Mail,
  Check,
  X,
  Trash2,
  Radio,
  Loader2,
  Crown,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useConvoy, type Convoy } from "@/hooks/useConvoy";
import { usePlan, PLAN_LABEL } from "@/hooks/usePlan";
import { Switch } from "@/components/verden/Switch";

interface ConvoyModalProps {
  onClose: () => void;
  onOpenScreen?: (screen: string) => void;
}

const EMOJIS = ["🚗", "🚙", "🛻", "🏎️", "🚐", "🛵", "🚲", "🌿"];

export default function ConvoyModal({ onClose, onOpenScreen }: ConvoyModalProps) {
  const convoy = useConvoy();
  const plan = usePlan();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🚗");
  const [creating, setCreating] = useState(false);
  const [inviteFor, setInviteFor] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const mine = convoy.convoys.filter(
    (c) =>
      c.ownerId === convoy.userId ||
      c.members.some((m) => m.userId === convoy.userId && m.status === "accepted"),
  );

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Give your convoy a name.");
      return;
    }
    setCreating(true);
    try {
      await convoy.create(name.trim(), emoji);
      setName("");
      toast.success("Convoy created — invite your people.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create convoy.");
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite(convoyId: string) {
    setBusy(true);
    try {
      await convoy.invite(convoyId, inviteEmail);
      setInviteEmail("");
      setInviteFor(null);
      toast.success("Invite sent. They'll see it when they open Verden.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not invite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md overflow-y-auto animate-scaleIn">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
            <Users size={18} />
          </div>
          <span className="font-display font-bold text-lg">Convoy</span>
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Convoy"
          className="grid h-9 w-9 place-items-center rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      <div className="mx-auto w-full max-w-4xl space-y-8 p-6 md:p-10 flex-1">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Drive together
          </p>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Convoy</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            A convoy works with or without a trip. Invite people by email, they accept, and everyone
            who flips sharing on appears live on the map.
          </p>
        </div>

        {!plan.convoy && (
          <div className="glass flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Lock size={18} className="mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-display text-sm font-semibold">
                  Live convoy needs {PLAN_LABEL.pro}
                </p>
                <p className="text-xs text-muted-foreground">
                  You can plan convoys on {PLAN_LABEL.free}; live position sharing unlocks on{" "}
                  {PLAN_LABEL.pro}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenScreen?.("profile")}
              className="rounded-xl bg-primary px-4 py-2 text-center font-display text-xs font-bold text-primary-foreground cursor-pointer hover:bg-primary/90 transition"
            >
              Upgrade
            </button>
          </div>
        )}

        {convoy.loading ? (
          <div className="grid min-h-[40vh] place-items-center">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : (
          <>
            {/* Pending invites */}
            {convoy.myInvites.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Invitations
                </h2>
                {convoy.myInvites.map(({ convoy: c, member }) => (
                  <div
                    key={member.id}
                    className="glass flex items-center justify-between gap-3 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.coverEmoji}</span>
                      <div>
                        <p className="font-display font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">You've been invited to join</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label="Accept invitation"
                        onClick={async () => {
                          await convoy.respond(member.id, true);
                          toast.success(`Joined ${c.name}`);
                        }}
                        className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground cursor-pointer"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label="Decline invitation"
                        onClick={() => void convoy.respond(member.id, false)}
                        className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-muted-foreground cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Create */}
            <section className="glass space-y-4 rounded-3xl p-5">
              <h2 className="font-display font-semibold">New convoy</h2>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    aria-label={`Cover ${e}`}
                    onClick={() => setEmoji(e)}
                    className={`h-10 w-10 rounded-xl text-lg transition cursor-pointer ${
                      emoji === e ? "bg-primary/15 ring-2 ring-primary" : "bg-secondary"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value.slice(0, 60))}
                  placeholder="Sunday coast run"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground disabled:opacity-60 cursor-pointer"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create
                </button>
              </div>
            </section>

            {/* Convoys */}
            {mine.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No convoys yet. Create one above.
              </p>
            ) : (
              <div className="space-y-4">
                {mine.map((c) => (
                  <ConvoyCard
                    key={c.id}
                    convoy={c}
                    userId={convoy.userId}
                    canGoLive={plan.convoy}
                    busy={busy}
                    inviteOpen={inviteFor === c.id}
                    inviteEmail={inviteEmail}
                    onInviteEmail={setInviteEmail}
                    onToggleInvite={() => setInviteFor(inviteFor === c.id ? null : c.id)}
                    onInvite={() => void handleInvite(c.id)}
                    onSetActive={(active) => void convoy.setActive(c.id, active)}
                    onSetSharing={(memberId, enabled) => void convoy.setSharing(memberId, enabled)}
                    onRemoveMember={(memberId) => void convoy.removeMember(memberId)}
                    onDelete={() => void convoy.remove(c.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ConvoyCard(props: {
  convoy: Convoy;
  userId: string | null;
  canGoLive: boolean;
  busy: boolean;
  inviteOpen: boolean;
  inviteEmail: string;
  onInviteEmail: (v: string) => void;
  onToggleInvite: () => void;
  onInvite: () => void;
  onSetActive: (active: boolean) => void;
  onSetSharing: (memberId: string, enabled: boolean) => void;
  onRemoveMember: (memberId: string) => void;
  onDelete: () => void;
}) {
  const { convoy: c, userId } = props;
  const isOwner = c.ownerId === userId;
  const me = c.members.find((m) => m.userId === userId);
  const accepted = c.members.filter((m) => m.status === "accepted");
  const pending = c.members.filter((m) => m.status === "pending");
  const live = accepted.filter((m) => m.sharingEnabled && m.lat !== null);

  return (
    <section className="glass space-y-4 rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{c.coverEmoji}</span>
          <div>
            <p className="font-display font-semibold">{c.name}</p>
            <p className="text-xs text-muted-foreground">
              {accepted.length} member{accepted.length === 1 ? "" : "s"} · {live.length} sharing live
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              c.isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Radio size={12} className={c.isActive ? "animate-pulse" : ""} />
            {c.isActive ? "Active" : "Idle"}
          </span>
          {isOwner && (
            <Switch
              checked={c.isActive}
              disabled={!props.canGoLive}
              label="Convoy active"
              onChange={props.onSetActive}
            />
          )}
        </div>
      </div>

      {me && (
        <div className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Share my live position</p>
            <p className="text-xs text-muted-foreground">
              {props.canGoLive
                ? "Others in this convoy see your car move."
                : `Live sharing needs ${PLAN_LABEL.pro}.`}
            </p>
          </div>
          <Switch
            checked={me.sharingEnabled}
            disabled={!props.canGoLive}
            label="Share my live position"
            onChange={(next) => props.onSetSharing(me.id, next)}
          />
        </div>
      )}

      <ul className="space-y-2">
        {accepted.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  m.sharingEnabled && m.lat !== null ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              />
              <span className="truncate text-sm">
                {m.profile?.fullName ?? m.invitedEmail}
                {m.role === "owner" && (
                  <Crown size={12} className="ml-1 inline text-primary" aria-label="Owner" />
                )}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{m.activityStatus}</span>
            </div>
            {isOwner && m.role !== "owner" && (
              <button
                type="button"
                aria-label={`Remove ${m.invitedEmail}`}
                onClick={() => props.onRemoveMember(m.id)}
                className="text-muted-foreground transition hover:text-destructive cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
        {pending.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <Mail size={13} className="shrink-0" />
              <span className="truncate">{m.invitedEmail}</span>
              <span className="shrink-0 text-xs">pending</span>
            </span>
            {isOwner && (
              <button
                type="button"
                aria-label={`Cancel invite to ${m.invitedEmail}`}
                onClick={() => props.onRemoveMember(m.id)}
                className="text-muted-foreground transition hover:text-destructive cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {isOwner && (
        <div className="space-y-3 border-t border-border/60 pt-3">
          {props.inviteOpen ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={props.inviteEmail}
                onChange={(event) => props.onInviteEmail(event.target.value.slice(0, 255))}
                placeholder="friend@email.com"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={props.onInvite}
                disabled={props.busy}
                className="rounded-xl bg-primary px-4 py-2.5 font-display text-xs font-bold text-primary-foreground disabled:opacity-60 cursor-pointer"
              >
                Send invite
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={props.onToggleInvite}
                className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer hover:underline"
              >
                <Users size={14} /> Invite by email
              </button>
              <button
                type="button"
                onClick={props.onDelete}
                className="text-xs font-semibold text-muted-foreground transition hover:text-destructive cursor-pointer"
              >
                Delete convoy
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
