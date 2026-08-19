-- =========================================================
-- VERDEN 3 (THETA) MIGRATION
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- helper: updated_at ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================================
-- GARAGE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.garage_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'car',
  brand text,
  model text,
  color text NOT NULL DEFAULT '#22c55e',
  model_key text NOT NULL,
  cosmetics jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.garage_vehicles TO authenticated;
GRANT SELECT ON public.garage_vehicles TO anon;
GRANT ALL ON public.garage_vehicles TO service_role;
ALTER TABLE public.garage_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "garage readable by everyone" ON public.garage_vehicles FOR SELECT USING (true);
CREATE POLICY "garage insert own" ON public.garage_vehicles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "garage update own" ON public.garage_vehicles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "garage delete own" ON public.garage_vehicles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS garage_vehicles_user_idx ON public.garage_vehicles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS garage_vehicles_one_default ON public.garage_vehicles(user_id) WHERE is_default;
CREATE TRIGGER garage_vehicles_updated_at BEFORE UPDATE ON public.garage_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- migrate existing selection into the garage
INSERT INTO public.garage_vehicles (user_id, name, model_key, is_default)
SELECT p.id, COALESCE(p.selected_token, 'sedan.glb'), COALESCE(p.selected_token, 'sedan.glb'), true
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.garage_vehicles g WHERE g.user_id = p.id);

-- =========================================================
-- USER SETTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  map_mood text NOT NULL DEFAULT 'explorer',
  experience_mode text NOT NULL DEFAULT 'adult',
  navigation jsonb NOT NULL DEFAULT '{}'::jsonb,
  privacy jsonb NOT NULL DEFAULT '{}'::jsonb,
  accessibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  notifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  appearance jsonb NOT NULL DEFAULT '{}'::jsonb,
  experimental jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings manage own" ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- COLLABORATIVE TRIPS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.verden_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning',
  visibility text NOT NULL DEFAULT 'private',
  convoy_active boolean NOT NULL DEFAULT false,
  convoy_started_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  cover_emoji text NOT NULL DEFAULT '🌍',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verden_trips TO authenticated;
GRANT ALL ON public.verden_trips TO service_role;
ALTER TABLE public.verden_trips ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS verden_trips_owner_idx ON public.verden_trips(owner_id);
CREATE TRIGGER verden_trips_updated_at BEFORE UPDATE ON public.verden_trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.trip_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.verden_trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  activity_status text NOT NULL DEFAULT 'stopped',
  convoy_enabled boolean NOT NULL DEFAULT false,
  vehicle_model_key text,
  last_lat numeric,
  last_lng numeric,
  last_heading numeric,
  last_speed_kmh numeric,
  last_ping_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_members TO authenticated;
GRANT ALL ON public.trip_members TO service_role;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS trip_members_trip_idx ON public.trip_members(trip_id);
CREATE INDEX IF NOT EXISTS trip_members_user_idx ON public.trip_members(user_id);
CREATE TRIGGER trip_members_updated_at BEFORE UPDATE ON public.trip_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- membership helper (security definer avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_trip_member(_trip_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.trip_members m WHERE m.trip_id = _trip_id AND m.user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.verden_trips t WHERE t.id = _trip_id AND t.owner_id = _user_id);
$$;
REVOKE ALL ON FUNCTION public.is_trip_member(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_trip_member(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_trip_public(_trip_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.verden_trips t WHERE t.id = _trip_id AND t.visibility = 'public');
$$;
REVOKE ALL ON FUNCTION public.is_trip_public(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_trip_public(uuid) TO authenticated, service_role;

CREATE POLICY "trips readable by members or public" ON public.verden_trips FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR visibility = 'public' OR public.is_trip_member(id, auth.uid()));
CREATE POLICY "trips insert own" ON public.verden_trips FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "trips update by owner" ON public.verden_trips FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "trips delete by owner" ON public.verden_trips FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "trip members readable by members" ON public.trip_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_trip_member(trip_id, auth.uid()) OR public.is_trip_public(trip_id));
CREATE POLICY "trip members join self" ON public.trip_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "trip members update own" ON public.trip_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "trip members leave own" ON public.trip_members FOR DELETE TO authenticated USING (user_id = auth.uid());

-- invites
CREATE TABLE IF NOT EXISTS public.trip_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.verden_trips(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_invites TO authenticated;
GRANT ALL ON public.trip_invites TO service_role;
ALTER TABLE public.trip_invites ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS trip_invites_trip_idx ON public.trip_invites(trip_id);
CREATE POLICY "invites readable by members" ON public.trip_invites FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id, auth.uid()));
CREATE POLICY "invites created by members" ON public.trip_invites FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_trip_member(trip_id, auth.uid()));
CREATE POLICY "invites deleted by creator" ON public.trip_invites FOR DELETE TO authenticated USING (created_by = auth.uid());

-- redeem invite (security definer so joiners can resolve a code without reading the table)
CREATE OR REPLACE FUNCTION public.redeem_trip_invite(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv public.trip_invites; uid uuid := auth.uid(); vkey text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO inv FROM public.trip_invites WHERE code = _code;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN RAISE EXCEPTION 'Invite expired'; END IF;
  IF inv.max_uses IS NOT NULL AND inv.uses >= inv.max_uses THEN RAISE EXCEPTION 'Invite fully used'; END IF;
  SELECT model_key INTO vkey FROM public.garage_vehicles WHERE user_id = uid AND is_default LIMIT 1;
  INSERT INTO public.trip_members (trip_id, user_id, vehicle_model_key)
  VALUES (inv.trip_id, uid, COALESCE(vkey, 'sedan.glb'))
  ON CONFLICT (trip_id, user_id) DO NOTHING;
  UPDATE public.trip_invites SET uses = uses + 1 WHERE id = inv.id;
  RETURN inv.trip_id;
END; $$;
REVOKE ALL ON FUNCTION public.redeem_trip_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_trip_invite(text) TO authenticated;

-- timeline events
CREATE TABLE IF NOT EXISTS public.trip_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.verden_trips(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  place_name text,
  lat numeric,
  lng numeric,
  starts_at timestamptz,
  notes text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  participants jsonb NOT NULL DEFAULT '[]'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_events TO authenticated;
GRANT ALL ON public.trip_events TO service_role;
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS trip_events_trip_pos_idx ON public.trip_events(trip_id, position);
CREATE TRIGGER trip_events_updated_at BEFORE UPDATE ON public.trip_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "events readable by members" ON public.trip_events FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id, auth.uid()) OR public.is_trip_public(trip_id));
CREATE POLICY "events insert by members" ON public.trip_events FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_trip_member(trip_id, auth.uid()));
CREATE POLICY "events update by members" ON public.trip_events FOR UPDATE TO authenticated
  USING (public.is_trip_member(trip_id, auth.uid())) WITH CHECK (public.is_trip_member(trip_id, auth.uid()));
CREATE POLICY "events delete by members" ON public.trip_events FOR DELETE TO authenticated
  USING (public.is_trip_member(trip_id, auth.uid()));

-- trip places (destinations / hotels / meeting points)
CREATE TABLE IF NOT EXISTS public.trip_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.verden_trips(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'destination',
  name text NOT NULL,
  address text,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  model_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_places TO authenticated;
GRANT ALL ON public.trip_places TO service_role;
ALTER TABLE public.trip_places ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS trip_places_trip_idx ON public.trip_places(trip_id, position);
CREATE TRIGGER trip_places_updated_at BEFORE UPDATE ON public.trip_places
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "places readable by members" ON public.trip_places FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id, auth.uid()) OR public.is_trip_public(trip_id));
CREATE POLICY "places insert by members" ON public.trip_places FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_trip_member(trip_id, auth.uid()));
CREATE POLICY "places update by members" ON public.trip_places FOR UPDATE TO authenticated
  USING (public.is_trip_member(trip_id, auth.uid())) WITH CHECK (public.is_trip_member(trip_id, auth.uid()));
CREATE POLICY "places delete by members" ON public.trip_places FOR DELETE TO authenticated
  USING (public.is_trip_member(trip_id, auth.uid()));

-- spatial notes
CREATE TABLE IF NOT EXISTS public.trip_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.verden_trips(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '📍',
  photo_url text,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_notes TO authenticated;
GRANT ALL ON public.trip_notes TO service_role;
ALTER TABLE public.trip_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS trip_notes_trip_idx ON public.trip_notes(trip_id);
CREATE TRIGGER trip_notes_updated_at BEFORE UPDATE ON public.trip_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "notes readable by members" ON public.trip_notes FOR SELECT TO authenticated
  USING (public.is_trip_member(trip_id, auth.uid()) OR public.is_trip_public(trip_id));
CREATE POLICY "notes insert by members" ON public.trip_notes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_trip_member(trip_id, auth.uid()));
CREATE POLICY "notes update by members" ON public.trip_notes FOR UPDATE TO authenticated
  USING (public.is_trip_member(trip_id, auth.uid())) WITH CHECK (public.is_trip_member(trip_id, auth.uid()));
CREATE POLICY "notes delete by author" ON public.trip_notes FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- =========================================================
-- COMMUNITY
-- =========================================================
CREATE TABLE IF NOT EXISTS public.map_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.verden_trips(id) ON DELETE CASCADE,
  kind text NOT NULL,
  note text,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_alerts TO authenticated;
GRANT ALL ON public.map_alerts TO service_role;
ALTER TABLE public.map_alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS map_alerts_expiry_idx ON public.map_alerts(expires_at);
CREATE INDEX IF NOT EXISTS map_alerts_geo_idx ON public.map_alerts(lat, lng);
CREATE POLICY "alerts readable when live" ON public.map_alerts FOR SELECT TO authenticated
  USING (expires_at > now() AND (trip_id IS NULL OR public.is_trip_member(trip_id, auth.uid())));
CREATE POLICY "alerts insert own" ON public.map_alerts FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "alerts update own" ON public.map_alerts FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "alerts delete own" ON public.map_alerts FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.place_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_ref text,
  place_name text NOT NULL,
  tag text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.place_reports TO authenticated;
GRANT ALL ON public.place_reports TO service_role;
ALTER TABLE public.place_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS place_reports_ref_idx ON public.place_reports(place_ref);
CREATE INDEX IF NOT EXISTS place_reports_expiry_idx ON public.place_reports(expires_at);
CREATE POLICY "reports readable when live" ON public.place_reports FOR SELECT TO authenticated USING (expires_at > now());
CREATE POLICY "reports insert own" ON public.place_reports FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "reports delete own" ON public.place_reports FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.amenity_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amenity_ref text NOT NULL,
  amenity_kind text NOT NULL,
  status text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amenity_reports TO authenticated;
GRANT ALL ON public.amenity_reports TO service_role;
ALTER TABLE public.amenity_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS amenity_reports_ref_idx ON public.amenity_reports(amenity_ref);
CREATE POLICY "amenity reports readable" ON public.amenity_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "amenity reports insert own" ON public.amenity_reports FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "amenity reports delete own" ON public.amenity_reports FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.saved_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_places TO authenticated;
GRANT ALL ON public.saved_places TO service_role;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS saved_places_user_idx ON public.saved_places(user_id);
CREATE POLICY "saved places manage own" ON public.saved_places FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================================
-- ACHIEVEMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  emoji text NOT NULL DEFAULT '🏆',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO authenticated, anon;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements readable" ON public.achievements FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS user_achievements_user_idx ON public.user_achievements(user_id);
CREATE POLICY "user achievements read own" ON public.user_achievements FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user achievements insert own" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

INSERT INTO public.achievements (code, title, description, emoji) VALUES
  ('first_arrival','First Arrival','Complete your first Verden navigation','🚗'),
  ('weekend_explorer','Weekend Explorer','Navigate on a Saturday and a Sunday','🧭'),
  ('perfect_convoy','Perfect Convoy','Finish a convoy with every member arriving','🤝'),
  ('steps_together','10,000 Steps Together','Walk 10km combined with trip members','👟'),
  ('five_landmarks','Five Landmarks','Visit five different landmarks','🏛️'),
  ('eco_hero','Eco Hero','Save 50 kg of CO₂ with green routes','🌱'),
  ('note_taker','Note Taker','Leave ten spatial trip notes','📝'),
  ('offline_ready','Offline Ready','Download your first offline region','📦')
ON CONFLICT (code) DO NOTHING;

-- =========================================================
-- OFFLINE + NOTIFICATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.offline_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  min_lng numeric NOT NULL,
  min_lat numeric NOT NULL,
  max_lng numeric NOT NULL,
  max_lat numeric NOT NULL,
  min_zoom numeric NOT NULL DEFAULT 8,
  max_zoom numeric NOT NULL DEFAULT 15,
  status text NOT NULL DEFAULT 'pending',
  progress numeric NOT NULL DEFAULT 0,
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offline_regions TO authenticated;
GRANT ALL ON public.offline_regions TO service_role;
ALTER TABLE public.offline_regions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS offline_regions_user_idx ON public.offline_regions(user_id);
CREATE TRIGGER offline_regions_updated_at BEFORE UPDATE ON public.offline_regions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "offline regions manage own" ON public.offline_regions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);
CREATE POLICY "notifications read own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications insert own" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications update own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications delete own" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =========================================================
-- TRIPS TABLE EXTENSIONS (navigation history)
-- =========================================================
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS travel_profile text NOT NULL DEFAULT 'driving';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS verden_trip_id uuid REFERENCES public.verden_trips(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS trips_user_created_idx ON public.trips(user_id, created_at DESC);

-- =========================================================
-- SUBSCRIPTION TIER RENAME: Mark / Horizon / Frontier
-- =========================================================
ALTER TABLE public.memberships DROP CONSTRAINT IF EXISTS memberships_membership_check;
ALTER TABLE public.membership_profiles DROP CONSTRAINT IF EXISTS membership_profiles_membership_check;

UPDATE public.memberships SET membership = CASE lower(membership)
  WHEN 'pro' THEN 'horizon' WHEN 'max' THEN 'frontier' WHEN 'free' THEN 'mark' ELSE lower(membership) END;
UPDATE public.membership_profiles SET membership = CASE lower(membership)
  WHEN 'pro' THEN 'horizon' WHEN 'max' THEN 'frontier' WHEN 'free' THEN 'mark' ELSE lower(membership) END;

ALTER TABLE public.memberships ADD CONSTRAINT memberships_membership_check
  CHECK (membership IN ('mark','horizon','frontier'));
ALTER TABLE public.membership_profiles ADD CONSTRAINT membership_profiles_membership_check
  CHECK (membership IN ('mark','horizon','frontier'));

-- =========================================================
-- REALTIME
-- =========================================================
ALTER TABLE public.trip_members REPLICA IDENTITY FULL;
ALTER TABLE public.trip_events REPLICA IDENTITY FULL;
ALTER TABLE public.trip_places REPLICA IDENTITY FULL;
ALTER TABLE public.trip_notes REPLICA IDENTITY FULL;
ALTER TABLE public.map_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.verden_trips REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_events; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_places; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_notes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.map_alerts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.verden_trips; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =========================================================
-- EXPIRY CLEANUP
-- =========================================================
CREATE OR REPLACE FUNCTION public.purge_expired_map_data()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.map_alerts WHERE expires_at < now() - interval '1 day';
  DELETE FROM public.place_reports WHERE expires_at < now() - interval '1 day';
  UPDATE public.trip_members SET last_lat = NULL, last_lng = NULL, last_heading = NULL, last_speed_kmh = NULL
    WHERE last_ping_at < now() - interval '1 day';
END; $$;
REVOKE ALL ON FUNCTION public.purge_expired_map_data() FROM public;
GRANT EXECUTE ON FUNCTION public.purge_expired_map_data() TO service_role;