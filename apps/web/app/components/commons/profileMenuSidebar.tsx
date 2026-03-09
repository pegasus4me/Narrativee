"use client";

import { authClient } from "../../../lib/auth-client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, MoreVertical } from "lucide-react";
import { useSideBarStore } from "../../state/SideBar.store";

interface ProfileMenuSidebarProps {
    isSidebarOpen: boolean;
}

export default function ProfileMenuSidebar({ isSidebarOpen }: ProfileMenuSidebarProps) {
    const session = authClient.useSession();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);
    const plan = useSideBarStore((state) => state.plan);

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
        <div className="relative w-full" ref={menuRef}>
            {/* The trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center w-full transition-colors rounded-lg hover:bg-gray-800 focus:outline-none ${isSidebarOpen ? 'p-2 justify-between' : 'p-1 justify-center'}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <Image
                        src={session?.data?.user?.image || '/default-avatar.png'}
                        alt={session?.data?.user?.name || 'User'}
                        width={isSidebarOpen ? 32 : 32}
                        height={isSidebarOpen ? 32 : 32}
                        className="rounded-full shrink-0"
                    />
                    {isSidebarOpen && (
                        <div className="flex flex-col text-left overflow-hidden">
                            <span className="flex items-center text-sm font-medium text-gray-200">
                                <span className="truncate max-w-[120px]">{session.data.user.name}</span>
                                {plan && (
                                    <span className={`text-[10px] bg-orange-500 px-1.5 py-0.5 rounded tracking-wider font-bold ml-2 `}>
                                        {plan === 'free' ? 'Trial' : plan.replace(' 🖋️', '')}
                                    </span>
                                )}
                            </span>
                            <span className="text-xs text-gray-500 truncate w-32">{session.data.user.email}</span>
                        </div>
                    )}
                </div>
                {isSidebarOpen && (
                    <MoreVertical className="w-4 h-4 text-gray-500 shrink-0" />
                )}
            </button>

            {/* The dropdown menu (pops UP) */}
            {isOpen && (
                <div className={`absolute bottom-full mb-2 bg-[#1a1b1c] border border-[#2e3033] rounded-xl shadow-lg shadow-black/50 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 ${isSidebarOpen ? 'w-full left-0' : 'w-48 left-12'}`}>
                    {/* If sidebar is collapsed, show the user info inside the popup so they know who is logged in */}
                    {!isSidebarOpen && (
                        <div className="px-4 py-2 border-b border-[#2e3033] mb-1">
                            <p className="text-sm font-medium text-gray-200 truncate">{session.data.user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{session.data.user.email}</p>
                        </div>
                    )}

                    <Link
                        href="/setting"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        Account Settings
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-500 hover:bg-red-950/30 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}
