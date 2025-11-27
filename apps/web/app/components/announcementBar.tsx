"use client"
import Link from "next/link";
import { authClient } from "../../lib/auth-client";

// 1. Fixed typo in component name
export default function AnnouncementBar() {
    // 2. Destructure 'isPending' to prevent the bar from flashing briefly while checking auth
    const { data: session, isPending } = authClient.useSession();

    // 3. Early return: If loading or user is logged in, render nothing (null is cleaner than <></>)
    if (isPending || session?.user) return null;

    return (
        // 4. Improved Color Contrast: Amber-400 with white text is hard to read. 
        //    Using Amber-100 background with Amber-900 text is much more readable (WCAG compliant).
        <div className="bg-amber-100 p-2 text-center text-sm text-amber-900">
            <p className="font-medium">
                You are currently working as a guest.{" "}
                {/* 5. Added a Call to Action (CTA) link */}
                <Link href="/auth/signin" className="underline hover:text-amber-700 transition-colors">
                    Sign in to save your work
                </Link>
            </p>
        </div>
    );
}