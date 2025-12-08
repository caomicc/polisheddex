# Plan: Reduce Vercel Costs for PolishedDex

Your ~$53/month overages stem primarily from middleware running on every Pokemon request (23M edge requests), API routes serving static content, and full analytics tracking. This is a largely static database site that can be heavily optimized.

## Steps

1. **Refactor middleware to static redirects** — Move URL normalization logic from `src/middleware.ts` to static redirects in `next.config.ts` using the `redirects` config, eliminating edge function executions on every `/pokemon/*` request.

2. **Convert `/api/faq` to build-time static page** — Replace the client-side fetch in `src/app/faq/page.tsx` with a server component that fetches FAQ.md at build time, removing the API route entirely.

3. **Eliminate `/api/events` route** — The events page already imports JSON directly; remove `src/app/api/events/route.ts` if no longer needed, or switch all consumers to static imports.

4. **Add `dynamicParams = false` to all dynamic routes** — Currently only `/locations/[name]` has this; add it to `/pokemon/[name]/page.tsx`, `/items/[name]/page.tsx`, `/moves/[name]/page.tsx`, and `/abilities/[name]/page.tsx` to prevent ISR fallback requests.

5. **Sample or disable Vercel analytics** — In `src/app/layout.tsx`, either configure `<SpeedInsights sampleRate={0.1} />` for 10% sampling, remove Speed Insights entirely (~$14/mo savings), or switch to a self-hosted alternative like Plausible.

6. **Make faithful preference client-only** — Refactor the context in `src/context/FaithfulPreferenceContext.tsx` to use `document.cookie` directly instead of calling `/api/faithful-preference`, reducing function invocations.

## Further Considerations

1. **Full static export?** Given this is a database reference site, `output: 'export'` in next.config.ts could eliminate nearly all server costs — would you lose any critical dynamic features?

2. **Analytics importance?** Would removing Speed Insights ($14.30) be acceptable if you keep Web Analytics, or do you need both for performance monitoring?

3. **Middleware normalization patterns** — How many redirect patterns exist? If it's a finite list (e.g., `Pikachu` → `pikachu`), a static redirect map works; if it's algorithmic, consider handling normalization purely client-side or at link-generation time.

Updated Plan: Full Static Export for PolishedDex
Your codebase is ready for full static export. Wiki already redirects to GitHub, no hardcoded Pokemon URLs exist.

Steps
Delete all API routes — Remove the entire api directory:

api/abilities/ — will bundle data instead
api/moves/ — will bundle data instead
api/locations/ — will bundle data instead
api/events/ — unused
api/faithful-preference/ — replaced by client-only hook
api/faq/ — will convert to build-time fetch
api/wiki/ — unused (already have redirect in next.config.ts)
Bundle move/ability data into Pokemon JSON — During extraction, include resolved move and ability data in each Pokemon's JSON. Update pokemon-form-client.tsx to read from props instead of useMoveData hook.

Convert FAQ to build-time static — Make page.tsx a server component that fetches FAQ.md at build time with no revalidation.

Delete middleware and add dynamicParams = false — Remove middleware.ts. Add export const dynamicParams = false to /pokemon/[name], /items/[name], /moves/[name], /abilities/[name].

Enable static export — Add to next.config.ts:

Remove or adjust Vercel analytics — Either remove <SpeedInsights /> and <Analytics /> from layout.tsx entirely (saves ~$26/mo), or keep them (they work on static but still incur per-event costs).

Implementation Order
Order Task Complexity
1 Delete middleware.ts Simple delete
2 Add dynamicParams = false to 4 routes 4 one-line additions
3 Delete api directory Simple delete
4 Convert FAQ page to server component Moderate refactor
5 Bundle move/ability data in extraction Extraction script update
6 Update pokemon-form-client.tsx to use bundled data Component refactor
7 Add output: 'export' + images.unoptimized to config Config change
8 Remove analytics (optional) Simple delete
Cost Impact
With full static export:

Edge Requests: $0 (no middleware, no edge functions)
Function Invocations: $0 (no API routes)
ISR Reads/Writes: $0 (no ISR, fully static)
Fast Origin Transfer: $0 (no serverless functions)
Analytics: $0–$26 depending on whether you keep them
Estimated monthly cost: $0 (within Vercel free tier for static sites)
