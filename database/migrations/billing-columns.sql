-- WIT-19: Add billing columns to organizations table
-- Purpose: Track subscription status, tier, and end date for Stripe webhook handler

ALTER TABLE public.organizations
ADD COLUMN subscription_status text DEFAULT 'free',
ADD COLUMN subscription_tier text DEFAULT 'basic',
ADD COLUMN subscription_end_date timestamp with time zone;

-- Create index on stripe_customer_id for faster webhook lookups
CREATE INDEX idx_organizations_stripe_customer_id ON public.organizations(stripe_customer_id);

-- Add comment for clarity
COMMENT ON COLUMN public.organizations.subscription_status IS 'Current subscription status: free, active, or canceled';
COMMENT ON COLUMN public.organizations.subscription_tier IS 'Subscription tier: basic, pro';
COMMENT ON COLUMN public.organizations.subscription_end_date IS 'Date when subscription expires or was canceled';
