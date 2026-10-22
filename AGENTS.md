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
- Signed-in pages (dashboard, landlord listing form, messages) live under `src/routes/_authenticated/`; never add `_authenticated/index.tsx` because `src/routes/index.tsx` owns `/` and a childless or index-claiming pathless layout breaks the route tree.
- Listings, conversations and messages are read/written from the browser Supabase client and protected by RLS; listing photos live in the private `property-images` bucket under `<owner_id>/` and are shown via signed URLs.
- No demo/sample data in code or migrations — the marketplace shows only real user listings.
