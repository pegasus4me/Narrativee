import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.NODE_ENV === 'production' ? process.env.SK_LIVE : process.env.SK_TEST;
if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is missing in environment variables');
}

export const stripe = new Stripe(secret, {
    apiVersion: '2025-01-27.acacia' as any, // Cast to any to avoid strict version mismatch if types are outdated
    typescript: true,
});
