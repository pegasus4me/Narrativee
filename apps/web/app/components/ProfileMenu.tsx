import { authClient } from "../../lib/auth-client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reportApi } from "../../lib/apis";

export default function ProfileMenu() {
    const session = authClient.useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Fetch credits
    useEffect(() => {
        if (session.data?.user) {
            reportApi.getUserCredits().then(setCredits).catch(console.error);
        }
    }, [session.data?.user]);

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/auth/signin");
                },
            },
        });
    };

    if (!session.data?.user) {
        return null;
    }

    console.log(session.data.user.plan);
    return (
        <div className="relative" ref={menuRef}>
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end mr-2">
                    <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-petrona)' }}>
                        {(session.data.user as any).plan ? (session.data.user as any).plan.charAt(0).toUpperCase() + (session.data.user as any).plan.slice(1) : 'Free'} plan
                    </span>
                    {credits !== null && (
                        <span className="text-xs text-amber-600 font-medium">{credits} credits</span>
                    )}
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer border border-transparent hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                >
                    <Image
                        src={session?.data?.user?.image || '/default-avatar.png'}
                        alt={session?.data?.user?.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-900">{session?.data?.user.name}</span>
                </button>
            </div>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.data.user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.data.user.email}</p>
                    </div>

                    <Link
                        href="/workspace"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        Workspace
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}