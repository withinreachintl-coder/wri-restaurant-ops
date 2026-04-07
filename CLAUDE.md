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

## App Interior Pages (Post-Login)

All pages accessed after login (dashboard, checklist, billing, help, settings) use a **light cream aesthetic** to contrast with the dark landing/auth pages.

### Background & Layout

```css
/* Page wrapper */
background: #FAFAF9;  /* Light cream — NOT dark #1C1917 */
max-width: 768px;
margin: 0 auto;
padding: 0 24px;
```

### Cards & Containers

```css
/* All cards, sections, content boxes */
background: #FFFFFF;
border: 1px solid #E8E3DC;
border-radius: 8px;
padding: 20px;
```

**Never use:**
- Dark transparent backgrounds (`rgba(255,255,255,0.03)`)
- Dark card colors (`#141210` or `#1C1917`)
- Heavy shadows (use subtle borders instead)

### Text Colors (Light Background)

```css
--text-primary: #1C1917;      /* Headings, labels */
--text-secondary: #78716C;    /* Body text, descriptions */
--text-muted: #6B5B4E;        /* Hints, captions */
```

**Never use light text colors** (#F5F0E8, #A89880) on interior pages — these are for dark backgrounds only.

### Buttons (Interior Pages)

```css
/* Primary action buttons */
background: #D97706;
color: #1C1917;
border-radius: 4px;
font-weight: 500;

/* Destructive/delete buttons */
background: #EF4444;  /* Red — keep as-is */
color: #FFFFFF;
```

**Never use:**
- Tan/beige buttons
- Blue buttons
- Light gray buttons as primary CTAs

### Page Structure

```tsx
<main className="min-h-screen" style={{ background: '#FAFAF9' }}>
  <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 24px' }}>
    {/* Page content with white cards */}
  </div>
</main>
```

### Examples of Interior Pages

- `/dashboard` — main app hub
- `/checklist` — opening/closing checklists
- `/billing` — subscription management
- `/help` — documentation
- `/settings` — account settings (when built)

### Auth & Marketing Pages (Dark Background)

These pages **keep the dark aesthetic**:
- `/` — landing page
- `/auth/login` — login/magic link
- `/welcome` — onboarding flow

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

## Security Rules — Non-Negotiable

### API Keys & Secrets
- NEVER put real API keys in `.env.example` — placeholders only
- Example: `RESEND_API_KEY=your_resend_api_key_here`
- Real keys go in `.env.local` only — this file is in `.gitignore` and never commits
- If you accidentally commit a real key, tell Keon immediately so it can be revoked
- Before every push, visually confirm `.env.example` contains no real key values

### node_modules
- NEVER commit `node_modules` to git — ever
- Before the first `git add .` on any repo, confirm `node_modules/` is in `.gitignore`
- Run `git status` before `git add .` and check what files are staged
- If node_modules appears in `git status`, stop and add it to `.gitignore` first

### Verified incidents (March 2026)
- Resend API key was committed to `.env.example` in wri-restaurant-ops — key revoked, new key issued
- node_modules committed in wri-staff-comms first push — required `filter-branch` to clean history

---

## Database Tables (Supabase — wri-restaurant-ops)

| Table | Purpose |
|---|---|
| `checklist_items` | Checklist task items (use this one) |
| `checklists` | Opening/closing checklist records |
| `organizations` | Org records |
| `users` | User profiles |
| `checklist_completions` | Completion tracking |
| `audit_forms` | LP audit form definitions |
| `audit_items` | Items within an LP audit form |
| `audit_schedules` | Recurring LP audit schedules |
| `audit_runs` | Individual LP audit run instances |
| `audit_responses` | Per-item responses for an audit run |
| `audit_exceptions` | Auto-flagged items outside threshold |
| `r_m_tickets` | R&M repair/maintenance request tickets |
| `r_m_categories` | Equipment categories for R&M tickets |
| `r_m_vendors` | Vendor contact book |
| `feature_flags` | Global feature flags (rollout_pct canary control) |
| `feature_flag_overrides` | Per-org force-enable/disable overrides |

---

## Phase 3 Status (as of April 2026)

Phase 3 features are **live and canary-gating to 10% of accounts** via `feature_flags` table in Supabase:
- `phase3` flag: `enabled=true`, `rollout_pct=10`
- To promote to 100%: run `UPDATE feature_flags SET rollout_pct=100 WHERE name='phase3';` after confirming error rates
- To force-enable for a specific org: insert into `feature_flag_overrides(flag_name, org_id, enabled)`

### Phase 3 Feature Areas
| Feature | Route | Status |
|---|---|---|
| PWA Offline Checklists | `/checklist` | Live (Phase 3 Week 1) |
| LP Audit Forms | `/audit-forms` | Live, canary-gated |
| LP Audit Exceptions | `/audit-exceptions` | Live, canary-gated |
| LP Audit Trends | `/audit-trends` | Live, canary-gated |
| R&M Ticket Tracking | `/maintenance` | Live, canary-gated |
| R&M Submit | `/maintenance/submit` | Live, canary-gated |

### File Upload Limits (enforced)
- R&M ticket photos: images only (JPEG/PNG/WebP/HEIC), max **5 MB** per file
- Checklist photos: images only, no hard size limit client-side (compress recommended)

### E2E Tests
- `e2e/offline-checklist.spec.ts` — offline + sync flow
- `e2e/lp-audit.spec.ts` — LP audit create/submit lifecycle
- `e2e/rm-ticket.spec.ts` — R&M ticket submit → assign → complete
- `e2e/cross-feature.spec.ts` — cross-feature integration (offline + LP + R&M)

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
---

## Feature Backlog (approved, not yet built)

### Brand Color Customization
Paying customers ($19/mo) should be able to customize the checklist and 
dashboard background and accent colors to match their restaurant's brand.

Scope:
- Checklist page background and card colors
- Dashboard page background and card colors
- NOT the landing page or auth pages

Implementation notes:
- Store brand_color_primary and brand_color_secondary on the organizations table
- Apply colors via CSS variables scoped to the app interior only
- Add a simple color picker in account/settings page
- Free tier users see default WRI cream/amber theme only
- Paid tier unlocks color customization
```

