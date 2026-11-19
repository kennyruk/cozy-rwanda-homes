import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "property-images";
const PATH_RE = /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,200}$/;

/** Signs photo links only for photos attached to live listings and uploaded by that listing's owner. */
export const signPublicListingPhotos = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ paths: z.array(z.string().regex(PATH_RE)).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const paths = Array.from(new Set(data.paths));
    if (!paths.length) return { urls: {} as Record<string, string> };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("properties")
      .select("owner_id, images")
      .eq("available", true)
      .overlaps("images", paths);
    const allowed = new Set<string>();
    (rows ?? []).forEach((r) => r.images.forEach((p: string) => { if (p.startsWith(`${r.owner_id}/`)) allowed.add(p); }));
    const ok = paths.filter((p) => allowed.has(p));
    const urls: Record<string, string> = {};
    if (ok.length) {
      const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrls(ok, 60 * 60 * 24);
      signed?.forEach((s) => { if (s.path && s.signedUrl) urls[s.path] = s.signedUrl; });
    }
    return { urls };
  });
