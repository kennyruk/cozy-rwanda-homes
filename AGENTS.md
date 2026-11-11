<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- The landing page look is the look of the whole site. Shared tokens (Roboto, ink blue, accent green, 4px radii, light weights) live in `:root` in `src/styles.css`; `src/landing.css` is loaded globally from `src/routes/__root.tsx`, and every page uses the shared header/footer in `src/components/smart-rent/layout.tsx` (built from the landing's `.villa-*` / `.estate-*` classes). Do not add a page-specific stylesheet or a second font stack that makes a page look different from the landing page.
- Motion: animate only `opacity`, `transform` and the individual `translate`/`scale` properties (compositor-only, smooth at 120Hz). Never animate `width`, `height`, `top`, `left`, `background-position` or box-shadow. Keep the `prefers-reduced-motion` block at the end of `src/styles.css`.
- Signed-in pages (dashboard, landlord listing form, messages) live under `src/routes/_authenticated/`; never add `_authenticated/index.tsx` because `src/routes/index.tsx` owns `/` and a childless or index-claiming pathless layout breaks the route tree.
- Listings, conversations and messages are read/written from the browser Supabase client and protected by RLS; listing photos live in the private `property-images` bucket under `<owner_id>/` and are shown via signed URLs.
- No demo/sample data in code or migrations — the marketplace shows only real user listings.
- Account type (tenant or landlord) lives in `public.user_roles` (one row per user, chosen at sign-up via `account_type` metadata or the in-app chooser); RLS uses `public.has_role` so only landlords create listings/upload photos and only tenants start conversations — UI checks in `useAuth().role` are cosmetic.
