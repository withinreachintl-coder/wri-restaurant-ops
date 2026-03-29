# WRI Daily Ops Checklist — Claude Code Instructions

> Read this file at the start of every session before touching any code.

---

## Project Overview

- **Product:** Daily Ops Checklist — a restaurant operations SaaS tool
- **URL:** https://ops.wireach.tools
- **Repo:** withinreachintl-coder/wri-restaurant-ops (branch: main)
- **Stack:** Next.js 14.1.0, Supabase, Tailwind CSS, TypeScript, Vercel
- **Stripe:** $19/mo, 14-day free trial
- **Target user:** Independent restaurant owners and managers

---

## Design Direction — Non-Negotiable

This product serves busy restaurant operators. Every design decision must feel
like it belongs in a well-run kitchen: dark, confident, warm, professional.
Nothing generic. Nothing that looks like it came from an AI template.

### Aesthetic: Warm Utilitarian

Think: cast iron, amber light, chalkboard menus, a kitchen that means business.
- Dark backgrounds (#1C1917 primary, #141210 deep)
- Amber accent (#D97706) — used sparingly, never overused
- Warm off-white text (#F5F0E8) — never pure white
- Muted warm grays for secondary text (#A89880, #6B5B4E)

### Typography Rules

- **Display / Headings:** Playfair Display (serif) — import from Google Fonts
- **Body / UI:** DM Sans — import from Google Fonts
- NEVER use: Inter, Roboto, Arial, system-ui as the primary font
- NEVER use: generic sans-serif stacks for headings
- Heading weight: 700 for hero, 500 for section heads
- Body weight: 300 for paragraphs, 400 for UI labels, 500 for emphasis

### Color System

```css
--color-bg-primary: #1C1917;
--color-bg-deep: #141210;
--color-bg-surface: #FAFAF9;
--color-bg-card-dark: rgba(255,255,255,0.04);
--color-accent: #D97706;
--color-accent-hover: #B45309;
--color-accent-muted: rgba(217,119,6,0.15);
--color-text-primary-dark: #F5F0E8;
--color-text-secondary-dark: #A89880;
--color-text-muted-dark: #6B5B4E;
--color-text-primary-light: #1C1917;
--color-text-secondary-light: #78716C;
--color-border-dark: rgba(255,255,255,0.08);
--color-border-light: #E8E3DC;
```

### Component Rules

- Border radius: 4px for buttons/badges, 8px for cards and containers
- Borders: 1px solid with low-opacity — never heavy outlines
- No drop shadows — use border and background contrast instead
- No purple gradients — ever
- No blue primary buttons — amber only for primary CTAs
- Checkboxes: amber fill when checked (#D97706), dark border when open

### Buttons

```css
/* Primary */
background: #D97706; color: #1C1917; border-radius: 4px; font-weight: 500;

/* Ghost / Secondary */
background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #F5F0E8;
```

---

## Code Rules

### TypeScript
- Always handle null explicitly with ternary operators — NOT short-circuit evaluation
- Example: `disabled={itemLimit ? !itemLimit.canAdd : false}`
- Never use `!` non-null assertions on values that could realistically be null

### Supabase
- Always get org_id from the authenticated user session — never hardcode UUIDs
- Pattern: `supabase.auth.getUser()` → look up org from users/organizations table
- Table for checklist tasks: `checklist_items` (NOT `checklist_tasks`)
- RLS: debug in SQL editor, not the Supabase UI policy builder

### Next.js 14.1.0
- Auth: use `@supabase/ssr` — NOT the deprecated `@supabase/auth-helpers-nextjs`
- Supabase client: always import from `@/lib/supabase`
- Every page must have a root layout (`app/layout.tsx`)

### Before Every Push
1. Audit ALL imports across all files in `app/` — confirm every module exists
2. Check `package.json` has every dependency that is imported
3. Run `npm run build` locally and confirm it passes before pushing
4. Never push a build you haven't verified locally

---

## Database Tables (Supabase — wri-restaurant-ops)

| Table | Purpose |
|---|---|
| `checklist_items` | Checklist task items (use this one) |
| `checklists` | Opening/closing checklist records |
| `organizations` | Org records |
| `users` | User profiles |
| `checklist_completions` | Completion tracking |

---

## Current Bugs (fix in priority order)

1. **Add Item / Delete** — org_id is hardcoded. Must pull from real auth session.
2. **Photo upload** — button exists but file input not properly wired.
3. **Stripe billing page** — in-app upgrade flow not built yet.

---

## Environment Variables (already set in Vercel — do not re-add)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`

---

## Deployment

- Vercel auto-deploys on every push to `main`
- Check vercel.com after pushing to confirm a build triggered
- If no new build appears within 60 seconds, the push likely went to the wrong branch

---

## What Success Looks Like

Every screen should make a restaurant owner think:
*"This was built by someone who understands my operation."*

Not: *"This looks like another generic SaaS tool."*
