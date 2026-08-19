
CREATE TABLE public.memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  membership text NOT NULL CHECK (membership IN ('pro','max'))
);
GRANT SELECT ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read codes" ON public.memberships FOR SELECT TO authenticated USING (true);

CREATE TABLE public.membership_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  membership text NOT NULL CHECK (membership IN ('pro','max')),
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_profiles TO authenticated;
GRANT ALL ON public.membership_profiles TO service_role;
ALTER TABLE public.membership_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own membership" ON public.membership_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own membership" ON public.membership_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own membership" ON public.membership_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
