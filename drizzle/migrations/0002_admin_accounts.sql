CREATE TABLE public.admins (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id);
$$;

CREATE POLICY "Users see own admin status" ON public.admins FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Account types: admins can see and change everyone's
GRANT UPDATE ON public.user_roles TO authenticated;
CREATE POLICY "Admins read all account types" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins set account types" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins change account types" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Profiles
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Listings
CREATE POLICY "Admins update listings" ON public.properties FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete listings" ON public.properties FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Conversations and messages: admins read and remove everything
GRANT DELETE ON public.conversations TO authenticated;
GRANT DELETE ON public.messages TO authenticated;
CREATE POLICY "Admins read conversations" ON public.conversations FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete conversations" ON public.conversations FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins read messages" ON public.messages FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete messages" ON public.messages FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Listing photos
CREATE POLICY "Admins delete property images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-images' AND public.is_admin(auth.uid()));