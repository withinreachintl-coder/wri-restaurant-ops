# Daily Ops Setup Guide

## 1. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs resend
```

## 2. Environment Variables

Already configured in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RESEND_API_KEY=your-resend-key
NEXT_PUBLIC_APP_URL=https://ops.wireach.tools
```

## 3. Supabase Setup

### Create Storage Bucket

```sql
-- In Supabase Dashboard > Storage > Create Bucket
-- Name: photos
-- Public: true (for easy photo access)
```

### Run Database Schema

Execute `supabase-schema.sql` in Supabase SQL Editor.

### Configure Auth

In Supabase Dashboard > Authentication > Providers:

1. **Email Provider**: Enabled (default)
2. **Magic Link**: Enabled
3. **Site URL**: `https://ops.wireach.tools`
4. **Redirect URLs**: Add `https://ops.wireach.tools/auth/callback`

### Custom SMTP (Optional)

In Supabase Dashboard > Project Settings > Auth > SMTP Settings:

- Use Resend SMTP for branded emails
- **SMTP Host**: smtp.resend.com
- **Port**: 465 (SSL) or 587 (TLS)
- **Username**: resend
- **Password**: Your Resend API key

## 4. File Structure

```
app/
├── auth/
│   ├── login/page.tsx          # Magic link login
│   └── callback/route.ts       # OAuth callback
├── components/
│   └── PhotoUploadV2.tsx       # Supabase Storage upload
├── api/
│   └── send-summary/
│       └── route-v2.ts         # Resend email sender
lib/
├── supabase.ts                 # Supabase client & helpers
└── resend.ts                   # Email templates
```

## 5. Features Wired Up

### Authentication
- ✅ Magic link login via Supabase Auth
- ✅ Email sent via Resend (branded domain)
- ✅ Secure session management
- ✅ Auto-redirect after login

### File Upload
- ✅ Camera capture (mobile-first)
- ✅ Gallery upload
- ✅ Supabase Storage integration
- ✅ Public URL generation
- ✅ 5MB file size limit

### Email Notifications
- ✅ Magic link emails
- ✅ Team invitations
- ✅ Shift summaries (completion reports)
- ✅ Shift swap requests
- ✅ Branded from address (noreply@wireach.tools)

### Real-time Features
- ✅ Supabase real-time subscriptions
- ✅ Channel message updates
- ✅ Read receipt tracking

## 6. Testing Locally

```bash
npm run dev
```

Visit:
- http://localhost:3000 - Landing page
- http://localhost:3000/auth/login - Login
- http://localhost:3000/dashboard - Dashboard (requires auth)
- http://localhost:3000/team - Team chat (requires auth)
- http://localhost:3000/schedule - Schedules (requires auth)

## 7. Deployment

Already configured! Push to `main` branch → Vercel auto-deploys.

```bash
git add .
git commit -m "Wire up Supabase Auth, Resend, and Storage"
git push origin main
```

## 8. Next Steps

1. **Create Storage Bucket**: Supabase Dashboard > Storage > Create "photos" bucket (public)
2. **Run Schema**: Copy `supabase-schema.sql` into Supabase SQL Editor
3. **Test Auth**: Try login at ops.wireach.tools/auth/login
4. **Seed Data**: Create test organization, users, channels
5. **Test Photos**: Upload a photo in checklist flow
6. **Test Emails**: Complete a checklist, verify summary email arrives

## 9. Admin Tasks

### Create First Organization

```sql
-- Run in Supabase SQL Editor after signing up
INSERT INTO organizations (name, owner_email, plan)
VALUES ('Test Restaurant', 'your@email.com', 'premium');

-- Get org_id from result, then create user
INSERT INTO users (org_id, email, name, role)
VALUES ('org-uuid-here', 'your@email.com', 'Your Name', 'owner');
```

### Create Default Channels

```sql
-- Replace org-uuid with your org_id
INSERT INTO channels (org_id, name, type, admin_only) VALUES
  ('org-uuid', '📢 Announcements', 'announcements', true),
  ('org-uuid', '💬 General Chat', 'general', false),
  ('org-uuid', '📅 Schedule Changes', 'schedule-changes', true);
```

## 10. Monitoring

- **Supabase Dashboard**: Monitor auth sessions, storage usage, database queries
- **Resend Dashboard**: Track email delivery, opens, bounces
- **Vercel Dashboard**: Monitor deployments, serverless function logs

## 11. Costs (Estimated)

- **Supabase Free Tier**: 500MB database, 1GB storage, 50K auth users
- **Resend Free Tier**: 3,000 emails/month
- **Vercel Hobby**: Free for personal projects

For paid plans:
- Supabase Pro: $25/mo (100GB database, 100GB storage)
- Resend: $20/mo (50K emails)
- Total: ~$45/mo for infrastructure (scales with usage)

## 12. Security Checklist

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their organization's data
- ✅ Magic links expire after 1 hour
- ✅ Storage bucket has size limits (5MB per file)
- ✅ API routes validate required fields
- ✅ Supabase auth handles session security

## Support

Issues? Check:
1. Vercel logs (Runtime Logs tab)
2. Supabase logs (Database > Logs)
3. Browser console for client errors
4. Network tab for API failures
