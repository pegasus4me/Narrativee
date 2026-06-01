"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { usePostHog } from "posthog-js/react";

const isTrialExpired = (createdAtString?: string | Date | null, plan?: string | null) => {
    if (!createdAtString || plan !== "free") return false;
    const createdAt = new Date(createdAtString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7;
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending } = authClient.useSession();
    const ph = usePostHog();

    const isExpired = session?.user ? isTrialExpired(session.user.createdAt, (session.user as any).plan) : false;

    useEffect(() => {
        if (!isPending) {
            if (!session?.user) {
                // Not logged in => redirect to signin
                router.push("/auth/signin");
            } else if (isExpired) {
                // Free trial expired => redirect to pricing
                router.push("/pricing?expired=true");
            } else if (!session.user.onboarded && pathname !== "/onboarding") {
                // Logged in but not onboarded => redirect to onboarding
                router.push("/onboarding");
            } else if (session.user) {
                // Identify the user in PostHog so all events are linked
                ph?.identify(session.user.id, {
                    email: session.user.email,
                    name: session.user.name,
                });
            }
        }
    }, [isPending, session, pathname, router, ph, isExpired]);

    // Keep the layout visually consistent while checking session
    if (isPending || (!session?.user) || isExpired || (!session?.user?.onboarded)) {
        return null;
    }

    return <>{children}</>;
}
