DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles of listing owners are public" ON public.profiles FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.owner_id = profiles.id));
CREATE POLICY "Users read own and chat partner profiles" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.tenant_id = auth.uid() AND c.landlord_id = profiles.id)
       OR (c.landlord_id = auth.uid() AND c.tenant_id = profiles.id)));

DROP POLICY IF EXISTS "Property images are readable" ON storage.objects;
CREATE POLICY "Photos of live listings are readable" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-images' AND EXISTS (
    SELECT 1 FROM public.properties p WHERE p.available AND storage.objects.name = ANY (p.images)));
CREATE POLICY "Owners and admins read property images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'property-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid())));