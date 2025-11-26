"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client"; 
import { ReportAPI } from "../../lib/apis";
export default function WorkspaceMainPage() {
    // 1. Correctly destructure the session hook
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const api = new ReportAPI()

    const data = useMemo(async() => {
        const res = await api.getAllReports()
        return res
    }, [])

    console.log("d", data)
    useEffect(() => {
        // 2. Logic to handle unauthenticated users
        // You cannot return JSX from useEffect. Use router.push to redirect instead.
        if (!isPending && !session) { 
            router.push("/signin"); // Change this to your actual login route (e.g., /login or /signin)
        }
    }, [session, isPending, router]);

    // 3. Handle Loading State
    if (isPending) {
        return (
            <div className="h-full w-full flex items-center justify-center text-gray-500">
                Loading workspace...
            </div>
        );
    }

    // 4. Return null if redirecting (prevents flash of content)
    if (!session) {
        return null;
    }

    // 5. Render protected content
    return (
        <div className="h-full w-full overflow-y-auto p-4">
            <div className="p-5">
                <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-petrona)' }}>
                    <span className="font-light">Hey</span>, {session.user.name}
                    </h1>
            </div>
        </div>
    );
}