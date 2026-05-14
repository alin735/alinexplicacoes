CREATE TABLE IF NOT EXISTS public.group_classes_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS group_classes_waitlist_email_unique_idx
  ON public.group_classes_waitlist (LOWER(email));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'set_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_group_classes_waitlist_updated_at ON public.group_classes_waitlist;
    CREATE TRIGGER set_group_classes_waitlist_updated_at
      BEFORE UPDATE ON public.group_classes_waitlist
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.group_classes_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view group classes waitlist" ON public.group_classes_waitlist;
DROP POLICY IF EXISTS "Service role manages group classes waitlist" ON public.group_classes_waitlist;

CREATE POLICY "Admin can view group classes waitlist" ON public.group_classes_waitlist
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Service role manages group classes waitlist" ON public.group_classes_waitlist
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
