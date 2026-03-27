# Vercel Environment Variables Setup

## Required Environment Variables

Add these to your Vercel project at: **Settings → Environment Variables**

### Supabase Configuration

**NEXT_PUBLIC_SUPABASE_URL**
```
https://hrenwlintzheyrylntjc.supabase.co
```

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
sb_publishable_cylgtsKx89xJo52ONQhmgg_HAip7DxU
```

### Email Configuration

**RESEND_API_KEY**
```
your_resend_api_key_here
```

### Stripe Configuration (Required for billing)

**STRIPE_SECRET_KEY**
```
sk_live_... (get from Stripe Dashboard → Developers → API keys)
```

**Note:** The `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is optional and only needed if you plan to use Stripe.js on the client side

## How to Add in Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Select the `wri-restaurant-ops` project
3. Click **Settings** → **Environment Variables**
4. Add each variable:
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: (paste the URL above)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
5. Click **Save** for each
6. **Redeploy** the latest deployment to apply the changes

## After Adding Variables

Once added and redeployed, the following features will work:
- ✅ Add Item button (edit mode)
- ✅ Delete tasks
- ✅ Task persistence across sessions
- ✅ User authentication (if implemented)

## Troubleshooting

If the Add Item button still shows errors after deploying:
1. Verify the environment variables are saved in Vercel
2. Check that you selected all environments (Production, Preview, Development)
3. Redeploy the project (don't just refresh - need a new deployment)
4. Check browser console for specific error messages
