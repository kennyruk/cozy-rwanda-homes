CREATE TYPE public.app_role AS ENUM ('tenant', 'landlord');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own account type" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users choose own account type once" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Existing users who already listed homes become landlords
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT p.owner_id, 'landlord'::public.app_role FROM public.properties p
JOIN auth.users u ON u.id = p.owner_id
ON CONFLICT (user_id) DO NOTHING;

-- New sign-ups pick tenant or landlord on the sign-up form
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), NULLIF(NEW.raw_user_meta_data->>'name',''), split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  IF NEW.raw_user_meta_data->>'account_type' IN ('tenant', 'landlord') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'account_type')::public.app_role)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP POLICY "Owners create listings" ON public.properties;
CREATE POLICY "Landlords create listings" ON public.properties FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'landlord'));

DROP POLICY "Tenants start conversations" ON public.conversations;
CREATE POLICY "Tenants start conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = tenant_id AND tenant_id <> landlord_id
  AND public.has_role(auth.uid(), 'tenant')
  AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = landlord_id)
);

DROP POLICY "Users upload own property images" ON storage.objects;
CREATE POLICY "Landlords upload own property images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text AND public.has_role(auth.uid(), 'landlord')
);