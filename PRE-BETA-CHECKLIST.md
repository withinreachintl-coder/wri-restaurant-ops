# Pre-Beta Test Checklist

**Beta Tester:** Guthrie  
**Project:** WRI Restaurant Ops Daily Checklist

---

## 🚨 CRITICAL - Must Fix Before Beta

### 1. Replace Hardcoded org_id with Real User's org_id
**Status:** ⚠️ TODO  
**Priority:** BLOCKER  
**Location:** `app/checklist/page.tsx` line ~58

**Current Code:**
```typescript
// Default org ID - should be replaced with actual user's org from auth
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000'
```

**What needs to happen:**
1. Get the logged-in user from Supabase auth
2. Query the `users` table to get their `org_id`
3. Use that real org_id when creating checklists

**Implementation:**
```typescript
// In loadOrCreateChecklist() function:
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  console.error('No authenticated user')
  return
}

const { data: userData } = await supabase
  .from('users')
  .select('org_id')
  .eq('id', user.id)
  .single()

const orgId = userData?.org_id || DEFAULT_ORG_ID
```

**Why this matters:**
- Each restaurant needs their own checklists
- Without proper org_id, all restaurants share the same checklist
- Could expose one restaurant's data to another

---

## ✅ Completed Pre-Beta Fixes

- [x] Add Item button works (network request fires)
- [x] Uses correct table name (`checklist_items`)
- [x] Supabase environment variables configured in Vercel
- [x] RLS infinite recursion fixed
- [x] Real checklist UUID (not hardcoded string)
- [x] Delete button works
- [x] Edit mode toggle works

---

## 📋 Nice to Have (Post-Beta)

### Medium Priority
- [ ] Persist completion status to database (currently local state resets on reload)
- [ ] Implement photo upload to Supabase Storage (currently placeholder)
- [ ] Add proper authentication flow (magic link/password)
- [ ] Email summary when checklist is completed

### Low Priority
- [ ] Drag-and-drop task reordering
- [ ] Multi-user real-time sync (see who's completing tasks)
- [ ] Task history/audit log
- [ ] Mobile app (React Native)
- [ ] Printable PDF export

---

## 🧪 Beta Test Checklist

When Guthrie tests, verify:
- [ ] Can create account / log in
- [ ] Opening checklist loads
- [ ] Closing checklist loads
- [ ] Can toggle tasks on/off
- [ ] Edit mode toggle works
- [ ] Can add new tasks
- [ ] Can delete tasks
- [ ] Progress bar updates
- [ ] Tasks persist after page reload
- [ ] Multiple users in same org see same checklists
- [ ] Users in different orgs see different checklists

---

## 🔧 Quick Reference

**Supabase Project:** hrenwlintzheyrylntjc  
**GitHub Repo:** withinreachintl-coder/wri-restaurant-ops  
**Vercel:** https://wri-restaurant-ops.vercel.app  
**Database Tables:**
- `checklists` - Master checklist (opening/closing)
- `checklist_items` - Individual tasks
- `users` - User accounts with org_id
- `organizations` - Restaurant organizations

**Key Files:**
- `app/checklist/page.tsx` - Main checklist UI
- `lib/supabase.ts` - Supabase client + auth helpers
- `lib/checklists.ts` - Checklist management functions
