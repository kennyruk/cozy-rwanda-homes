import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "property-images";

/** Permanently deletes the signed-in user's own account, listings, photos and conversations. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error } = await supabase.functions.invoke("delete-own-account", {
        headers: { Authorization: getRequest().headers.get("authorization")! },
      });
      if (error) throw new Error("Could not delete account", { cause: error });
      return { ok: true };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Remove listing photos stored under the user's own folder.
    for (;;) {
      const { data: files, error } = await supabaseAdmin.storage.from(BUCKET).list(userId, { limit: 100 });
      if (error || !files || files.length === 0) break;
      const { error: rmError } = await supabaseAdmin.storage.from(BUCKET).remove(files.map((f) => `${userId}/${f.name}`));
      if (rmError) break;
    }

    // Deleting the login cascades to profile, account type, listings, conversations and messages.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Could not delete account");
    return { ok: true };
  });
