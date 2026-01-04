"use client"
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/api-config";

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = authClient.useSession();
    const [checked, setChecked] = useState(false);

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

            // If not onboarded, redirect to onboarding page
            if (!data.onboarded && pathname !== '/onboarding') {
                router.replace('/onboarding');
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
        } finally {
            setChecked(true);
        }
    };

    // Don't render children until we've checked status
    if (!checked && session?.user?.id) {
        return null; // Or a loading spinner
    }

    return <>{children}</>;
}
