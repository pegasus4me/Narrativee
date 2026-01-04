"use client"
import { useEffect, useState } from "react";
import { WelcomeModal } from "./WelcomeModal";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
    const { data: session } = authClient.useSession();
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            checkOnboardingStatus();
        }
    }, [session]);

    const checkOnboardingStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/onboarding`, {
                credentials: 'include'
            });
            const data = await res.json() as any;

            if (!data.onboarded) {
                setShowWelcome(true);
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
        }
    };

    const handleWelcomeComplete = async () => {
        try {
            await fetch(`${API_URL}/onboarding/complete`, {
                method: 'POST',
                credentials: 'include'
            });
            setShowWelcome(false);
        } catch (error) {
            console.error('Error completing onboarding:', error);
            setShowWelcome(false);
        }
    };

    return (
        <>
            <WelcomeModal open={showWelcome} onComplete={handleWelcomeComplete} />
            {children}
        </>
    );
}
