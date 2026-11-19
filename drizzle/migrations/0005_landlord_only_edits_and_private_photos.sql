DROP POLICY IF EXISTS "Owners update listings" ON public.properties;
DROP POLICY IF EXISTS "Owners delete listings" ON public.properties;
CREATE POLICY "Landlord owners update listings" ON public.properties FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'landlord'::public.app_role))
  WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'landlord'::public.app_role));
CREATE POLICY "Landlord owners delete listings" ON public.properties FOR DELETE TO authenticated
  USING (auth.uid() = owner_id AND public.has_role(auth.uid(), 'landlord'::public.app_role));
DROP POLICY IF EXISTS "Photos of live listings are readable" ON storage.objects;