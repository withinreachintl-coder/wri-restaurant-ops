# Daily Ops Checklist

**Browser-based app for independent restaurant managers** to run opening and closing checklists with digital sign-off. Owner gets an automated summary after each shift.

## Features

- **Digital Checklists**: Opening and closing tasks with photo sign-off
- **Manager Dashboard**: Real-time completion tracking
- **Shift Summaries**: Automated reports after each shift
- **Mobile-First**: Works on any device, no app install required

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Stripe** (subscriptions)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...
```

## Deployment

Deployed on Vercel at **ops.wireach.tools**

## Pricing

$19/month subscription, 14-day free trial

---

**Built for independent restaurant owners who need simple, reliable ops management.**
