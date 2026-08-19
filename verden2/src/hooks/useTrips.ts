import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ActivityStatus } from "@/lib/map/types";

export type TripStatus = "planning" | "active" | "completed" | "archived";
export type TripVisibility = "private" | "shared" | "public";

export type Trip = {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  status: TripStatus;
  visibility: TripVisibility;
  convoyActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  coverEmoji: string;
  createdAt: string;
  memberCount: number;
  placeCount: number;
};

export type TripMember = {
  id: string;
  userId: string;
  role: string;
  activityStatus: ActivityStatus;
  convoyEnabled: boolean;
  vehicleModelKey: string | null;
  lat: number | null;
  lng: number | null;
  heading: number | null;
  speedKmh: number | null;
  lastPingAt: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

export type TripEvent = {
  id: string;
  title: string;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  startsAt: string | null;
  notes: string | null;
  participants: string[];
  position: number;
  createdBy: string;
};

export type TripPlace = {
  id: string;
  kind: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  position: number;
  createdBy: string;
};

export type TripNote = {
  id: string;
  body: string;
  emoji: string;
  photoUrl: string | null;
  lat: number;
  lng: number;
  createdBy: string;
  createdAt: string;
};

export type TripInvite = {
  id: string;
  code: string;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
};

/** List of every trip the caller can see, with light aggregate counts. */
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setLoading(false);
      return;
    }
    setUserId(u.user.id);
    const { data } = await supabase
      .from("verden_trips")
      .select("*")
      .order("created_at", { ascending: false });
    const ids = (data ?? []).map((t) => t.id);

    const counts: Record<string, { members: number; places: number }> = {};
    if (ids.length) {
      const [{ data: members }, { data: places }] = await Promise.all([
        supabase.from("trip_members").select("trip_id").in("trip_id", ids),
        supabase.from("trip_places").select("trip_id").in("trip_id", ids),
      ]);
      for (const id of ids) counts[id] = { members: 0, places: 0 };
      for (const m of members ?? []) counts[m.trip_id]!.members += 1;
      for (const p of places ?? []) counts[p.trip_id]!.places += 1;
    }

    setTrips(
      (data ?? []).map((t) => ({
        id: t.id,
        ownerId: t.owner_id,
        name: t.name,
        description: t.description,
        status: t.status as TripStatus,
        visibility: t.visibility as TripVisibility,
        convoyActive: t.convoy_active,
        startsAt: t.starts_at,
        endsAt: t.ends_at,
        coverEmoji: t.cover_emoji,
        createdAt: t.created_at,
        memberCount: counts[t.id]?.members ?? 0,
        placeCount: counts[t.id]?.places ?? 0,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const actions = useMemo(
    () => ({
      async create(input: {
        name: string;
        description?: string;
        coverEmoji?: string;
        startsAt?: string | null;
        visibility?: TripVisibility;
      }) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Sign in first.");
        const { data, error } = await supabase
          .from("verden_trips")
          .insert({
            owner_id: u.user.id,
            name: input.name,
            description: input.description ?? null,
            cover_emoji: input.coverEmoji ?? "🗺️",
            starts_at: input.startsAt ?? null,
            visibility: input.visibility ?? "private",
            status: "planning",
          })
          .select("id")
          .single();
        if (error) throw error;
        await supabase
          .from("trip_members")
          .insert({ trip_id: data.id, user_id: u.user.id, role: "owner" });
        await load();
        return data.id;
      },

      async update(
        tripId: string,
        patch: {
          name?: string;
          description?: string | null;
          cover_emoji?: string;
          status?: TripStatus;
          visibility?: TripVisibility;
          starts_at?: string | null;
          ends_at?: string | null;
        },
      ) {
        const { error } = await supabase.from("verden_trips").update(patch).eq("id", tripId);
        if (error) throw error;
        await load();
      },

      async remove(tripId: string) {
        const { error } = await supabase.from("verden_trips").delete().eq("id", tripId);
        if (error) throw error;
        await load();
      },

      async joinByCode(code: string) {
        const { data, error } = await supabase.rpc("redeem_trip_invite", { _code: code.trim() });
        if (error) throw error;
        await load();
        return data as string;
      },
    }),
    [load],
  );

  return { trips, loading, userId, reload: load, ...actions };
}

/** Everything one trip screen needs: members, timeline, places, notes, invites. */
export function useTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [places, setPlaces] = useState<TripPlace[]>([]);
  const [notes, setNotes] = useState<TripNote[]>([]);
  const [invites, setInvites] = useState<TripInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    setUserId(u.user?.id ?? null);

    const [tripRes, memberRes, eventRes, placeRes, noteRes, inviteRes] = await Promise.all([
      supabase.from("verden_trips").select("*").eq("id", tripId).maybeSingle(),
      supabase.from("trip_members").select("*").eq("trip_id", tripId),
      supabase.from("trip_events").select("*").eq("trip_id", tripId).order("position"),
      supabase.from("trip_places").select("*").eq("trip_id", tripId).order("position"),
      supabase
        .from("trip_notes")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false }),
      supabase.from("trip_invites").select("*").eq("trip_id", tripId),
    ]);

    const t = tripRes.data;
    setTrip(
      t
        ? {
            id: t.id,
            ownerId: t.owner_id,
            name: t.name,
            description: t.description,
            status: t.status as TripStatus,
            visibility: t.visibility as TripVisibility,
            convoyActive: t.convoy_active,
            startsAt: t.starts_at,
            endsAt: t.ends_at,
            coverEmoji: t.cover_emoji,
            createdAt: t.created_at,
            memberCount: memberRes.data?.length ?? 0,
            placeCount: placeRes.data?.length ?? 0,
          }
        : null,
    );

    const memberIds = (memberRes.data ?? []).map((m) => m.user_id);
    const profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (memberIds.length) {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url")
        .in("id", memberIds);
      for (const p of data ?? []) {
        profiles[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
      }
    }

    setMembers(
      (memberRes.data ?? []).map((m) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        activityStatus: m.activity_status as ActivityStatus,
        convoyEnabled: m.convoy_enabled,
        vehicleModelKey: m.vehicle_model_key,
        lat: m.last_lat === null ? null : Number(m.last_lat),
        lng: m.last_lng === null ? null : Number(m.last_lng),
        heading: m.last_heading === null ? null : Number(m.last_heading),
        speedKmh: m.last_speed_kmh === null ? null : Number(m.last_speed_kmh),
        lastPingAt: m.last_ping_at,
        fullName: profiles[m.user_id]?.full_name ?? null,
        avatarUrl: profiles[m.user_id]?.avatar_url ?? null,
      })),
    );

    setEvents(
      (eventRes.data ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        placeName: e.place_name,
        lat: e.lat === null ? null : Number(e.lat),
        lng: e.lng === null ? null : Number(e.lng),
        startsAt: e.starts_at,
        notes: e.notes,
        participants: Array.isArray(e.participants) ? (e.participants as string[]) : [],
        position: e.position,
        createdBy: e.created_by,
      })),
    );

    setPlaces(
      (placeRes.data ?? []).map((p) => ({
        id: p.id,
        kind: p.kind,
        name: p.name,
        address: p.address,
        lat: Number(p.lat),
        lng: Number(p.lng),
        position: p.position,
        createdBy: p.created_by,
      })),
    );

    setNotes(
      (noteRes.data ?? []).map((n) => ({
        id: n.id,
        body: n.body,
        emoji: n.emoji,
        photoUrl: n.photo_url,
        lat: Number(n.lat),
        lng: Number(n.lng),
        createdBy: n.created_by,
        createdAt: n.created_at,
      })),
    );

    setInvites(
      (inviteRes.data ?? []).map((i) => ({
        id: i.id,
        code: i.code,
        expiresAt: i.expires_at,
        maxUses: i.max_uses,
        uses: i.uses,
      })),
    );

    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* Realtime keeps every collaborator's timeline, places and notes in sync. */
  useEffect(() => {
    const channel = supabase.channel(`verden-trip-${tripId}`);
    for (const table of ["trip_members", "trip_events", "trip_places", "trip_notes"]) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `trip_id=eq.${tripId}` },
        () => void load(),
      );
    }
    channel
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "verden_trips", filter: `id=eq.${tripId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId, load]);

  const isOwner = trip?.ownerId === userId;

  const actions = useMemo(
    () => ({
      async addEvent(input: {
        title: string;
        placeName?: string;
        startsAt?: string | null;
        notes?: string;
        lat?: number | null;
        lng?: number | null;
      }) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Sign in first.");
        const { error } = await supabase.from("trip_events").insert({
          trip_id: tripId,
          created_by: u.user.id,
          title: input.title,
          place_name: input.placeName ?? null,
          starts_at: input.startsAt ?? null,
          notes: input.notes ?? null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          position: events.length,
        });
        if (error) throw error;
        await load();
      },

      async removeEvent(id: string) {
        await supabase.from("trip_events").delete().eq("id", id);
        await load();
      },

      async reorderEvents(ordered: TripEvent[]) {
        setEvents(ordered);
        await Promise.all(
          ordered.map((e, index) =>
            supabase.from("trip_events").update({ position: index }).eq("id", e.id),
          ),
        );
      },

      async addPlace(input: {
        name: string;
        kind: string;
        lat: number;
        lng: number;
        address?: string;
      }) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Sign in first.");
        const { error } = await supabase.from("trip_places").insert({
          trip_id: tripId,
          created_by: u.user.id,
          kind: input.kind,
          name: input.name,
          address: input.address ?? null,
          lat: input.lat,
          lng: input.lng,
          position: places.length,
        });
        if (error) throw error;
        await load();
      },

      async removePlace(id: string) {
        await supabase.from("trip_places").delete().eq("id", id);
        await load();
      },

      async addNote(input: { body: string; emoji: string; lat: number; lng: number }) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Sign in first.");
        const { error } = await supabase.from("trip_notes").insert({
          trip_id: tripId,
          created_by: u.user.id,
          body: input.body,
          emoji: input.emoji,
          lat: input.lat,
          lng: input.lng,
        });
        if (error) throw error;
        await load();
      },

      async removeNote(id: string) {
        await supabase.from("trip_notes").delete().eq("id", id);
        await load();
      },

      async setConvoy(active: boolean) {
        await supabase
          .from("verden_trips")
          .update({
            convoy_active: active,
            convoy_started_at: active ? new Date().toISOString() : null,
          })
          .eq("id", tripId);
        await load();
      },

      async setStatus(status: TripStatus) {
        await supabase.from("verden_trips").update({ status }).eq("id", tripId);
        await load();
      },

      async setVisibility(visibility: TripVisibility) {
        await supabase.from("verden_trips").update({ visibility }).eq("id", tripId);
        await load();
      },

      async toggleMyConvoySharing(enabled: boolean) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        await supabase
          .from("trip_members")
          .update({ convoy_enabled: enabled })
          .eq("trip_id", tripId)
          .eq("user_id", u.user.id);
        await load();
      },

      async createInvite() {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Sign in first.");
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        const { error } = await supabase.from("trip_invites").insert({
          trip_id: tripId,
          created_by: u.user.id,
          code,
          expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
        });
        if (error) throw error;
        await load();
        return code;
      },

      async revokeInvite(id: string) {
        await supabase.from("trip_invites").delete().eq("id", id);
        await load();
      },

      async removeMember(id: string) {
        await supabase.from("trip_members").delete().eq("id", id);
        await load();
      },
    }),
    [tripId, events.length, places.length, load],
  );

  return {
    trip,
    members,
    events,
    places,
    notes,
    invites,
    loading,
    userId,
    isOwner,
    reload: load,
    ...actions,
  };
}