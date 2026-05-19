import { authClient } from "../../../lib/auth-client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reportApi } from "../../../lib/apis";
import { Badge } from "@/components/ui/badge"

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

    return (
        <div className="relative" ref={menuRef}>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 px-3 py-2 text-zinc-800 transition-colors cursor-pointer hover:bg-zinc-100 rounded-lg focus:outline-none"
                >
                    <Image
                        src={session?.data?.user?.image || '/default-avatar.png'}
                        alt={session?.data?.user?.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-md shrink-0"
                    />
                    <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-sm font-medium text-zinc-900 truncate max-w-[120px]">
                            {session.data.user.name}
                        </span>
                        <span className="text-xs text-zinc-500 truncate max-w-[120px]">
                            {session.data.user.email}
                        </span>
                    </div>
                </button>
            </div>

            {isOpen && (
                <div className="absolute border right-0 mt-2 w-48 bg-red border rounded-xs border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.data.user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.data.user.email}</p>
                    </div>


                    <Link
                        href="/workspace"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        workspace
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