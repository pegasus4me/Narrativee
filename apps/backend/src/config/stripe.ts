import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set — Stripe functionality will fail.');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});
