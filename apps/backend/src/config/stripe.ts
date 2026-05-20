import Stripe from 'stripe';
import dotenv from "dotenv";
dotenv.config();
console.log(process.env.STRIPE_SECRET_KEY);

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_narrativee';

export const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});
