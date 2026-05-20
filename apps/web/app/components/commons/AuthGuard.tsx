"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { usePostHog } from "posthog-js/react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending } = authClient.useSession();

    const ph = usePostHog();

    useEffect(() => {
        if (!isPending) {
            if (!session?.user) {
                // Not logged in => redirect to signin
                router.push("/auth/signin");
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
    }, [isPending, session, pathname, router, ph]);

    // Keep the layout visually consistent while checking session
    if (isPending || (!session?.user) || (!session?.user?.onboarded)) {
        return null;
    }

    return <>{children}</>;
}
