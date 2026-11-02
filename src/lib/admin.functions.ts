import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "property-images";
/** ~100 years: Supabase has no "forever" ban. */
const SUSPEND_FOR = "876000h";

type Ctx = { supabase: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>; userId: string };

async function assertAdmin({ supabase, userId }: Ctx) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error || data !== true) throw new Error("Forbidden");
}

async function assertNotAdminTarget(ctx: Ctx, targetId: string) {
  if (targetId === ctx.userId) throw new Error("You can't do this to your own account here.");
  const { data } = await ctx.supabase.rpc("is_admin", { _user_id: targetId });
  if (data === true) throw new Error("Other admin accounts can't be changed.");
}

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "tenant" | "landlord" | null;
  isAdmin: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  suspended: boolean;
  listings: number;
};

/** Every account on the site with email, type, status and listing count. Admins only. */
export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const authUsers: { id: string; email?: string; created_at: string; last_sign_in_at?: string; email_confirmed_at?: string; banned_until?: string; user_metadata?: Record<string, unknown> }[] = [];
    for (let page = 1; page < 50; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error("Could not load accounts");
      authUsers.push(...data.users);
      if (data.users.length < 1000) break;
    }

    const [roles, profiles, admins, props] = await Promise.all([
      context.supabase.from("user_roles").select("user_id, role"),
      context.supabase.from("profiles").select("id, full_name"),
      context.supabase.from("admins").select("user_id"),
      context.supabase.from("properties").select("owner_id"),
    ]);
    const roleOf = new Map((roles.data ?? []).map((r) => [r.user_id, r.role]));
    const nameOf = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));
    const adminSet = new Set((admins.data ?? []).map((a) => a.user_id));
    const count = new Map<string, number>();
    (props.data ?? []).forEach((p) => count.set(p.owner_id, (count.get(p.owner_id) ?? 0) + 1));
    const now = Date.now();

    return authUsers
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        name: nameOf.get(u.id) || (u.user_metadata?.["full_name"] as string | undefined) || "",
        role: roleOf.get(u.id) ?? null,
        isAdmin: adminSet.has(u.id),
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        confirmed: !!u.email_confirmed_at,
        suspended: !!u.banned_until && new Date(u.banned_until).getTime() > now,
        listings: count.get(u.id) ?? 0,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

/** Suspend (blocks sign-in) or restore an account. Admins only; never other admins. */
export const adminSetSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; suspended: boolean }) => ({ userId: String(input.userId), suspended: !!input.suspended }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await assertNotAdminTarget(context, data.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: data.suspended ? SUSPEND_FOR : "none" });
    if (error) throw new Error("Could not update the account");
    if (data.suspended) {
      // Hide their listings while they're suspended.
      await context.supabase.from("properties").update({ available: false }).eq("owner_id", data.userId);
    }
    return { ok: true };
  });

/** Change someone's account type between tenant and landlord. Admins only. */
export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "tenant" | "landlord" }) => {
    if (input.role !== "tenant" && input.role !== "landlord") throw new Error("Invalid account type");
    return { userId: String(input.userId), role: input.role };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("user_roles").upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id" });
    if (error) throw new Error("Could not change the account type");
    return { ok: true };
  });

/** Permanently delete someone's account with their listings, photos and conversations. Admins only. */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => ({ userId: String(input.userId) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await assertNotAdminTarget(context, data.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (;;) {
      const { data: files, error } = await supabaseAdmin.storage.from(BUCKET).list(data.userId, { limit: 100 });
      if (error || !files || files.length === 0) break;
      const { error: rmError } = await supabaseAdmin.storage.from(BUCKET).remove(files.map((f) => `${data.userId}/${f.name}`));
      if (rmError) break;
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error("Could not delete the account");
    return { ok: true };
  });
