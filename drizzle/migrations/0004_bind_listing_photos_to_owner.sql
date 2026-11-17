DROP POLICY IF EXISTS "Photos of live listings are readable" ON storage.objects;
CREATE POLICY "Photos of live listings are readable" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'property-images' AND EXISTS (
  SELECT 1 FROM public.properties p
  WHERE p.available
    AND storage.objects.name = ANY (p.images)
    AND (storage.foldername(storage.objects.name))[1] = p.owner_id::text));