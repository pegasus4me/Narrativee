import { Router, Request, Response } from 'express';
import express from 'express';
import { stripe } from '../config/stripe';
import { db } from '../auth/auth';
import { user } from '../auth/schema/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.NODE_ENV === 'production' ? process.env.STRIPE_WEBHOOK_SECRET : process.env.STRIPE_TEST_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        console.error('❌ Webhook Error: Missing signature or secret');
        return res.status(400).send('Webhook Error: Missing signature or secret');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        console.log(`📨 Webhook received: ${event.type}`);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                console.log('🔔 Checkout session completed event received');
                const session = event.data.object as any;
                const userId = session.metadata?.userId;
                const subscriptionId = session.subscription;
                const customerId = session.customer;

                console.log('📦 Session data:', { userId, subscriptionId, customerId, metadata: session.metadata });

                if (userId) {
                    // Determine plan based on price ID or metadata
                    // For simplicity, assuming metadata or checking line items
                    // Ideally, pass plan name in metadata during checkout creation
                    const plan = session.metadata?.plan || 'premium';
                    console.log(`👤 Updating user ${userId} to plan ${plan}`);

                    await db.update(user)
                        .set({
                            stripeCustomerId: customerId,
                            stripeSubscriptionId: subscriptionId,
                            subscriptionStatus: 'active',
                            plan: plan,
                            // Add tokens based on plan
                            tokens: plan === 'pro' ? 300 : 130, // Example values
                        })
                        .where(eq(user.id, userId));

                    console.log(`✅ User ${userId} upgraded to ${plan}`);
                } else {
                    console.error('❌ No userId found in session metadata');
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any;
                const subscriptionId = invoice.subscription;
                const customerId = invoice.customer;

                // Find user by stripeSubscriptionId or customerId
                const users = await db.select().from(user).where(eq(user.stripeSubscriptionId, subscriptionId));
                const foundUser = users[0];

                if (foundUser) {
                    // Reset tokens on renewal
                    const plan = foundUser.plan;
                    const newTokens = plan === 'pro' ? 300 : (plan === 'premium' ? 130 : 50);

                    await db.update(user)
                        .set({
                            tokens: newTokens,
                            currentPeriodEnd: new Date(invoice.lines.data[0].period.end * 1000),
                            subscriptionStatus: 'active'
                        })
                        .where(eq(user.id, foundUser.id));

                    console.log(`✅ User ${foundUser.id} subscription renewed. Tokens reset to ${newTokens}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                const subscriptionId = subscription.id;

                await db.update(user)
                    .set({
                        plan: 'free',
                        subscriptionStatus: 'canceled',
                        tokens: 50 // Reset to free tier limits
                    })
                    .where(eq(user.stripeSubscriptionId, subscriptionId));

                console.log(`🚫 Subscription ${subscriptionId} canceled`);
                break;
            }
        }
    } catch (error) {
        console.error('Error handling webhook event:', error);
        return res.status(500).send('Webhook handler error');
    }

    res.json({ received: true });
});

// Create Checkout Session
router.post('/create-checkout-session', express.json(), verifyAuth, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { priceId, planName, isAnnual } = req.body;

        if (!priceId) {
            return res.status(400).json({ error: 'Price ID is required' });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: req.user.id,
                plan: planName, // 'premium' or 'pro'
            },
            customer_email: req.user.email,
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing?canceled=true`,
        });

        return res.json({ url: session.url });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        return res.status(500).json({ error: error.message });
    }
});

export default router;
