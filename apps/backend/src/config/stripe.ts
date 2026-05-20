import Stripe from 'stripe';
import dotenv from "dotenv";
dotenv.config();
console.log(process.env.STRIPE_SECRET_KEY);

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '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';

export const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});
