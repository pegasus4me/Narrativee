"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { reportApi } from "../../lib/apis";
import { IoSettingsSharp, IoLogOutOutline } from "react-icons/io5";
import { FaCoins } from "react-icons/fa";
import { HiChevronUpDown } from "react-icons/hi2";

interface SidebarProfileProps {
    isCollapsed: boolean;
}

export default function SidebarProfile({ isCollapsed }: SidebarProfileProps) {
    const { data: session } = authClient.useSession();
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
        if (session?.user) {
            reportApi.getUserCredits().then(setCredits).catch(console.error);
        }
    }, [session?.user]);

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/auth/signin");
                },
            },
        });
    };

    if (!session?.user) {
        return null;
    }

    return (
        <div className="relative " ref={menuRef}>
            <div
                className={`flex cursor-pointer hover:bg-gray-100 gap-2 items-center p-1 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Image
                    src={session.user.image || '/default-avatar.png'}
                    alt={session.user.name || 'User'}
                    width={20}
                    height={20}
                    className="rounded-full border-2 border-amber-400"
                />
                {!isCollapsed && (
                    <>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" style={{ fontFamily: 'var(--font-noto)' }}>
                                {session.user.name}
                            </p>
                        </div>
                        <HiChevronUpDown className="w-4 h-4" />
                    </>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                    </div>

                    <Link
                        href="/setting"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <IoSettingsSharp className="w-4 h-4" />
                        Settings
                    </Link>

                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700">
                        <FaCoins className="w-4 h-4 text-amber-500" />
                        <span>Tokens available: {credits !== null ? credits : '...'}</span>
                    </div>

                    <div className="border-t border-gray-100 mt-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <IoLogOutOutline className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
