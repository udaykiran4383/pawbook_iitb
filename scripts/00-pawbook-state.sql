-- The single table PawBook currently uses. Run once in Supabase's SQL editor.
CREATE TABLE IF NOT EXISTS public.pawbook_state (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now())
);
ALTER TABLE public.pawbook_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pawbook_state;
CREATE POLICY "Enable read access for all users" ON public.pawbook_state FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON public.pawbook_state;
CREATE POLICY "Enable insert for all users" ON public.pawbook_state FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON public.pawbook_state;
CREATE POLICY "Enable update for all users" ON public.pawbook_state FOR UPDATE USING (true);
