-- Migration: Create public.verden3_waitlist table
CREATE TABLE public.verden3_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);

-- Grant permissions to authenticated and service roles
GRANT SELECT, INSERT, DELETE ON public.verden3_waitlist TO authenticated;
GRANT ALL ON public.verden3_waitlist TO service_role;

-- Enable Row Level Security
ALTER TABLE public.verden3_waitlist ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies
CREATE POLICY "Users can read own waitlist entry" ON public.verden3_waitlist 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waitlist entry" ON public.verden3_waitlist 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own waitlist entry" ON public.verden3_waitlist 
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);
