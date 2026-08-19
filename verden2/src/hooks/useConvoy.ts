import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ActivityStatus } from "@/lib/map/types";

export type ConvoyMemberRow = {
  id: string;
  convoyId: string;
  userId: string | null;
  invitedEmail: string;
  role: string;
  status: "pending" | "accepted" | "declined";
  sharingEnabled: boolean;
  activityStatus: ActivityStatus;
  vehicleModelKey: string | null;
  lat: number | null;
  lng: number | null;
  heading: number | null;
  speedKmh: number | null;
  lastPingAt: string | null;
  profile?: { fullName: string | null; avatarUrl: string | null } | null;
};

export type Convoy = {
  id: string;
  ownerId: string;
  tripId: string | null;
  name: string;
  coverEmoji: string;
  isActive: boolean;
  startedAt: string | null;
  members: ConvoyMemberRow[];
};

/**
 * Convoy live-sharing cadence. Stationary members ping rarely; moving members
 * ping often so the map stays believable without hammering the database.
 */
export const PING_INTERVAL_STATIONARY_MS = 30_000;
export const PING_INTERVAL_MOVING_MS = 4_000;
export const PING_DISTANCE_THRESHOLD_M = 20;
export const MOVING_SPEED_KMH = 10;

export function metresBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type MemberRecord = {
  id: string;
  convoy_id: string;
  user_id: string | null;
  invited_email: string;
  role: string;
  status: string;
  sharing_enabled: boolean;
  activity_status: string;
  vehicle_model_key: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_heading: number | null;
  last_speed_kmh: number | null;
  last_ping_at: string | null;
};

function mapMember(
  row: MemberRecord,
  profiles: Record<string, { full_name: string | null; avatar_url: string | null }>,
): ConvoyMemberRow {
  return {
    id: row.id,
    convoyId: row.convoy_id,
    userId: row.user_id,
    invitedEmail: row.invited_email,
    role: row.role,
    status: (row.status as ConvoyMemberRow["status"]) ?? "pending",
    sharingEnabled: row.sharing_enabled,
    activityStatus: (row.activity_status as ActivityStatus) ?? "stopped",
    vehicleModelKey: row.vehicle_model_key,
    lat: row.last_lat === null ? null : Number(row.last_lat),
    lng: row.last_lng === null ? null : Number(row.last_lng),
    heading: row.last_heading === null ? null : Number(row.last_heading),
    speedKmh: row.last_speed_kmh === null ? null : Number(row.last_speed_kmh),
    lastPingAt: row.last_ping_at,
    profile: row.user_id && profiles[row.user_id]
      ? {
          fullName: profiles[row.user_id]!.full_name,
          avatarUrl: profiles[row.user_id]!.avatar_url,
        }
      : null,
  };
}

/**
 * Convoys are first-class and work with or without a trip. Members are invited
 * by email and must accept before they show up as active.
 */
export function useConvoy() {
  const [convoys, setConvoys] = useState<Convoy[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setLoading(false);
      return;
    }
    setUserId(u.user.id);
    setEmail(u.user.email ?? null);

    const { data: convoyRows } = await supabase
      .from("convoys")
      .select("id,owner_id,trip_id,name,cover_emoji,is_active,started_at")
      .order("created_at", { ascending: false });

    const ids = (convoyRows ?? []).map((c) => c.id);
    let memberRows: MemberRecord[] = [];
    if (ids.length) {
      const { data } = await supabase
        .from("convoy_members")
        .select(
          "id,convoy_id,user_id,invited_email,role,status,sharing_enabled,activity_status,vehicle_model_key,last_lat,last_lng,last_heading,last_speed_kmh,last_ping_at",
        )
        .in("convoy_id", ids);
      memberRows = (data ?? []) as MemberRecord[];
    }

    const memberUserIds = Array.from(
      new Set(memberRows.map((m) => m.user_id).filter((v): v is string => Boolean(v))),
    );
    const profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (memberUserIds.length) {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url")
        .in("id", memberUserIds);
      for (const p of data ?? []) {
        profiles[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
      }
    }

    setConvoys(
      (convoyRows ?? []).map((c) => ({
        id: c.id,
        ownerId: c.owner_id,
        tripId: c.trip_id,
        name: c.name,
        coverEmoji: c.cover_emoji,
        isActive: c.is_active,
        startedAt: c.started_at,
        members: memberRows
          .filter((m) => m.convoy_id === c.id)
          .map((m) => mapMember(m, profiles)),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* Realtime: any convoy or membership change refreshes the tree. */
  useEffect(() => {
    const channel = supabase
      .channel("verden-convoys")
      .on("postgres_changes", { event: "*", schema: "public", table: "convoy_members" }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "convoys" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const myInvites = useMemo(
    () =>
      convoys.flatMap((c) =>
        c.members
          .filter(
            (m) =>
              m.status === "pending" &&
              (m.userId === userId ||
                (email && m.invitedEmail.toLowerCase() === email.toLowerCase())),
          )
          .map((m) => ({ convoy: c, member: m })),
      ),
    [convoys, userId, email],
  );

  const activeConvoy = useMemo(() => {
    const mine = convoys.filter((c) => {
      const me = c.members.find(
        (m) =>
          m.userId === userId || (email && m.invitedEmail.toLowerCase() === email.toLowerCase()),
      );
      return c.ownerId === userId || me?.status === "accepted";
    });
    return mine.find((c) => c.isActive) ?? mine[0] ?? null;
  }, [convoys, userId, email]);

  const actions = useMemo(
    () => ({
      async create(name: string, coverEmoji = "🚗", tripId: string | null = null) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Sign in first.");
        const { data, error } = await supabase
          .from("convoys")
          .insert({ owner_id: u.user.id, name, cover_emoji: coverEmoji, trip_id: tripId })
          .select("id")
          .single();
        if (error) throw error;
        // The owner joins their own convoy immediately.
        await supabase.from("convoy_members").insert({
          convoy_id: data.id,
          user_id: u.user.id,
          invited_email: u.user.email ?? "",
          role: "owner",
          status: "accepted",
          joined_at: new Date().toISOString(),
        });
        await load();
        return data.id;
      },

      async invite(convoyId: string, inviteEmail: string) {
        const normalised = inviteEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
          throw new Error("That doesn't look like a valid email address.");
        }
        // Link the invite to an existing account when we can find one.
        const { data: match } = await supabase
          .from("profiles")
          .select("id,username")
          .eq("username", normalised)
          .maybeSingle();
        const { error } = await supabase.from("convoy_members").insert({
          convoy_id: convoyId,
          invited_email: normalised,
          user_id: match?.id ?? null,
          status: "pending",
        });
        if (error) {
          if (error.code === "23505" || error.message.includes("duplicate")) {
            throw new Error("That person has already been invited.");
          }
          throw error;
        }
        await load();
      },

      async respond(memberId: string, accept: boolean) {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("convoy_members")
          .update({
            status: accept ? "accepted" : "declined",
            user_id: u.user?.id ?? null,
            joined_at: accept ? new Date().toISOString() : null,
          })
          .eq("id", memberId);
        if (error) throw error;
        await load();
      },

      async setActive(convoyId: string, active: boolean) {
        const { error } = await supabase
          .from("convoys")
          .update({ is_active: active, started_at: active ? new Date().toISOString() : null })
          .eq("id", convoyId);
        if (error) throw error;
        setConvoys((prev) =>
          prev.map((c) => (c.id === convoyId ? { ...c, isActive: active } : c)),
        );
      },

      async setSharing(memberId: string, enabled: boolean) {
        await supabase
          .from("convoy_members")
          .update({ sharing_enabled: enabled })
          .eq("id", memberId);
        await load();
      },

      async setActivity(memberId: string, status: ActivityStatus) {
        await supabase.from("convoy_members").update({ activity_status: status }).eq("id", memberId);
      },

      async removeMember(memberId: string) {
        await supabase.from("convoy_members").delete().eq("id", memberId);
        await load();
      },

      async remove(convoyId: string) {
        await supabase.from("convoys").delete().eq("id", convoyId);
        await load();
      },

      async rename(convoyId: string, name: string, coverEmoji?: string) {
        await supabase
          .from("convoys")
          .update({ name, ...(coverEmoji ? { cover_emoji: coverEmoji } : {}) })
          .eq("id", convoyId);
        await load();
      },
    }),
    [load],
  );

  return { convoys, activeConvoy, myInvites, loading, userId, email, reload: load, ...actions };
}

/**
 * Pushes the caller's position into their convoy row, throttled by speed so
 * standing still costs almost nothing.
 */
export function useConvoyPing(memberId: string | null, enabled: boolean) {
  const lastSent = useRef(0);
  const lastPoint = useRef<{ lat: number; lng: number } | null>(null);

  return useCallback(
    async (point: { lat: number; lng: number; heading?: number; speedKmh?: number }) => {
      if (!memberId || !enabled) return;
      const moving = (point.speedKmh ?? 0) > MOVING_SPEED_KMH;
      const interval = moving ? PING_INTERVAL_MOVING_MS : PING_INTERVAL_STATIONARY_MS;
      const now = Date.now();
      const movedFar =
        lastPoint.current !== null &&
        metresBetween(lastPoint.current, point) > PING_DISTANCE_THRESHOLD_M;
      if (now - lastSent.current < interval && !movedFar) return;

      lastSent.current = now;
      lastPoint.current = { lat: point.lat, lng: point.lng };
      await supabase
        .from("convoy_members")
        .update({
          last_lat: point.lat,
          last_lng: point.lng,
          last_heading: point.heading ?? 0,
          last_speed_kmh: point.speedKmh ?? 0,
          last_ping_at: new Date().toISOString(),
          activity_status: moving ? "driving" : "stopped",
        })
        .eq("id", memberId);
    },
    [memberId, enabled],
  );
}