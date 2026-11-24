DROP POLICY IF EXISTS "Listings are public" ON public.properties;

CREATE POLICY "Live listings are public" ON public.properties FOR SELECT TO anon, authenticated
  USING (available = true);

CREATE POLICY "Owners, admins and chat tenants read listings" ON public.properties FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.property_id = properties.id AND c.tenant_id = auth.uid()
    )
  );