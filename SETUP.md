# Daily Ops Checklist - Setup Guide

## Edit Mode Fix

The "Add Item" button bug has been fixed! Here's what was implemented:

### What Changed
1. **Added Supabase integration** - Tasks now persist to a database
2. **Edit mode toggle** - Click "✏️ Edit" to enter edit mode
3. **Add Item functionality** - Properly wired with input state and Supabase API
4. **Delete tasks** - Remove items in edit mode
5. **Fallback handling** - Works offline with default tasks if DB isn't configured

### How to Set Up

#### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for it to initialize (2-3 minutes)

#### 2. Run the Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Open `supabase-schema.sql` from this project
3. Copy and paste the entire SQL into the editor
4. Click **Run** to create the table and policies

#### 3. Get Your Supabase Credentials
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy:
   - Project URL (looks like `https://xxxxx.supabase.co`)
   - Anon/Public key (starts with `eyJ...`)

#### 4. Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

#### 5. Install Dependencies (Already Done)
```bash
npm install
```

#### 6. Run the App
```bash
npm run dev
```

Visit [http://localhost:3000/checklist](http://localhost:3000/checklist)

---

## Using Edit Mode

### To Add Tasks:
1. Click **✏️ Edit** button (top right)
2. Fill in the task description
3. Check "Photo required" if needed
4. Click **Add Item** (or press Enter)

### To Delete Tasks:
1. Enter edit mode (✏️ Edit button)
2. Click **Delete** next to any task
3. Confirm deletion

### To Exit Edit Mode:
Click **✓ Done Editing** button

---

## Troubleshooting

### "Add Item" does nothing
- **Check browser console** (F12 → Console tab) for errors
- **Verify environment variables** are set in `.env.local`
- **Check Supabase** is accessible (go to your project URL in browser)

### Tasks don't save
- **Run the SQL schema** in Supabase SQL Editor
- **Check RLS policies** - the default policy allows all access
- **Verify API key** is correct (anon key, not service key)

### Can't connect to Supabase
- **Firewall/VPN** - Supabase might be blocked
- **Check credentials** in `.env.local`
- The app works offline with default hardcoded tasks

---

## Architecture

### Components
- `/app/checklist/page.tsx` - Main checklist UI with edit mode
- `/lib/supabase.ts` - Supabase client and types
- `supabase-schema.sql` - Database schema

### Data Flow
1. **On load** - Fetches tasks from Supabase
2. **Fallback** - Uses hardcoded defaults if DB fails
3. **Add Item** - Inserts to Supabase, updates local state
4. **Delete Item** - Removes from Supabase, updates local state
5. **Toggle completion** - Local state only (not persisted yet)

### Future Improvements
- Persist completion status to DB
- Photo upload to Supabase Storage
- Drag-and-drop reordering
- Multi-user real-time sync
- Authentication/authorization
