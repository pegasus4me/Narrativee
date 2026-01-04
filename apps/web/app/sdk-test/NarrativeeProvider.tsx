"use client";

import { useEffect } from "react";
import { narrativee } from "@narrativee/sdk";
import { authClient } from "@/lib/auth-client";

interface NarrativeeProviderProps {
    apiKey: string;
    children: React.ReactNode;
}

/**
 * Narrativee Provider
 * 
 * Handles SDK initialization and user identification automatically.
 */
export function NarrativeeProvider({ apiKey, children }: NarrativeeProviderProps) {
    const { data: session } = authClient.useSession();

    useEffect(() => {
        // 1. Initialize
        if (typeof window !== "undefined") {
            narrativee.init(apiKey);
        }

        // 2. Identify (when session loads)
        if (session?.user?.id) {
            narrativee.identify(session.user.id, {
                email: session.user.email,
                name: session.user.name,
                plan: "free"
            });
        }
    }, [apiKey, session]);

    return <>{children}</>;
}
