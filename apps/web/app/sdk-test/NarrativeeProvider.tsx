"use client";

import { useEffect } from "react";
import { narrativee } from "@narrativee/sdk";

interface NarrativeeProviderProps {
    apiKey: string;
    children: React.ReactNode;
}

/**
 * 🎭 DEMO MODE: Simulating a Customer's End User
 * 
 * In production, your CUSTOMER's app would use THEIR auth system,
 * not Narrativee's. This mock simulates that scenario.
 */
const DEMO_USER = {
    id: "demo-user-001",
    name: "Jane Cooper",
    email: "jane@acme-customer.com",
    plan: "trial"
};

/**
 * Narrativee Provider (Demo Version)
 * 
 * Simulates how a customer's app would integrate the SDK.
 */
export function NarrativeeProvider({ apiKey, children }: NarrativeeProviderProps) {

    useEffect(() => {
        if (typeof window !== "undefined") {
            // 1. Initialize SDK
            narrativee.init(apiKey);

            // 2. Identify the demo user (simulating customer's auth)
            console.log('[Demo] Identifying mock user:', DEMO_USER);
            narrativee.identify(DEMO_USER.id, {
                email: DEMO_USER.email,
                name: DEMO_USER.name,
                plan: DEMO_USER.plan
            });
        }
    }, [apiKey]);

    return <>{children}</>;
}
