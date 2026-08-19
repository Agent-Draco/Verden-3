CREATE TABLE public.convoys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.verden_trips(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'My Convoy',
  cover_emoji text NOT NULL DEFAULT '🚗',
  is_active boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.convoy_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  convoy_id uuid NOT NULL REFERENCES public.convoys(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  sharing_enabled boolean NOT NULL DEFAULT true,
  activity_status text NOT NULL DEFAULT 'stopped',
  vehicle_model_key text,
  last_lat numeric,
  last_lng numeric,
  last_heading numeric,
  last_speed_kmh numeric,
  last_ping_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (convoy_id, invited_email)
);

CREATE INDEX convoy_members_user_idx ON public.convoy_members (user_id);
CREATE INDEX convoy_members_email_idx ON public.convoy_members (lower(invited_email));
CREATE INDEX convoys_owner_idx ON public.convoys (owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.convoys TO authenticated;
GRANT ALL ON public.convoys TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.convoy_members TO authenticated;
GRANT ALL ON public.convoy_members TO service_role;

ALTER TABLE public.convoys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convoy_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_convoy_participant(_convoy_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.convoys c WHERE c.id = _convoy_id AND c.owner_id = _user_id)
      OR EXISTS (
        SELECT 1 FROM public.convoy_members m
        WHERE m.convoy_id = _convoy_id
          AND (m.user_id = _user_id
               OR lower(m.invited_email) = lower((SELECT u.email FROM auth.users u WHERE u.id = _user_id)))
      );
$$;

CREATE OR REPLACE FUNCTION public.is_convoy_owner(_convoy_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.convoys c WHERE c.id = _convoy_id AND c.owner_id = _user_id);
$$;

CREATE POLICY "Participants can view convoys" ON public.convoys
  FOR SELECT TO authenticated USING (public.is_convoy_participant(id, auth.uid()));
CREATE POLICY "Users can create convoys" ON public.convoys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update convoys" ON public.convoys
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete convoys" ON public.convoys
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Participants can view convoy members" ON public.convoy_members
  FOR SELECT TO authenticated USING (public.is_convoy_participant(convoy_id, auth.uid()));
CREATE POLICY "Owners can invite convoy members" ON public.convoy_members
  FOR INSERT TO authenticated WITH CHECK (public.is_convoy_owner(convoy_id, auth.uid()));
CREATE POLICY "Members update own row or owner manages" ON public.convoy_members
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(invited_email) = lower((SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
    OR public.is_convoy_owner(convoy_id, auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR lower(invited_email) = lower((SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
    OR public.is_convoy_owner(convoy_id, auth.uid())
  );
CREATE POLICY "Owners or self can remove convoy members" ON public.convoy_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_convoy_owner(convoy_id, auth.uid()));

CREATE TRIGGER convoys_updated_at BEFORE UPDATE ON public.convoys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER convoy_members_updated_at BEFORE UPDATE ON public.convoy_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.convoy_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.convoys;