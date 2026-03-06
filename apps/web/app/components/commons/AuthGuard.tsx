"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "../../../lib/auth-client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (!isPending) {
            if (!session?.user) {
                // Not logged in => redirect to signin
                router.push("/auth/signin");
            } else if (!session.user.onboarded && pathname !== "/onboarding") {
                // Logged in but not onboarded => redirect to onboarding
                router.push("/onboarding");
            }
        }
    }, [isPending, session, pathname, router]);

    // Keep the layout visually consistent while checking session
    if (isPending || (!session?.user) || (!session?.user?.onboarded)) {
        return null;
    }

    return <>{children}</>;
}
