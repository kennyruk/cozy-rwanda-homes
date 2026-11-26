import { createClient } from "npm:@supabase/supabase-js@2.117.3";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });
  const token = req.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return new Response(null, { status: 401 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return new Response(null, { status: 401 });
  const uid = data.user.id;
  const bucket = admin.storage.from("property-images");
  for (;;) {
    const { data: files, error } = await bucket.list(uid, { limit: 100 });
    if (error) return new Response("Photo lookup failed", { status: 502 });
    if (!files.length) break;
    const removed = await bucket.remove(files.map(file => uid + "/" + file.name));
    if (removed.error) return new Response("Photo cleanup failed", { status: 502 });
  }
  const deletion = await admin.auth.admin.deleteUser(uid);
  if (deletion.error) return new Response("Account deletion failed", { status: 502 });
  return Response.json({ ok: true });
});
