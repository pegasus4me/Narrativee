"use client";

import { authClient } from "../../../lib/auth-client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { DEFAULT_AVATAR } from "@/app/constants";

const getAvatar = (url?: string | null) => {
    if (!url || url.includes("vecteezy.com")) {
        return DEFAULT_AVATAR;
    }
    return url;
};

export default function ProfileMenuHeader() {
    const session = authClient.useSession();
    const [isOpen, setIsOpen] = useState(false);
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

    const { name, email, image } = session.data.user;

    return (
        <div className="relative" ref={menuRef}>
            {/* The trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 focus:outline-none p-1 rounded-lg hover:bg-zinc-800/40 transition-colors"
            >
                <Image
                    src={getAvatar(image)}
                    alt={name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full shrink-0 object-cover border border-zinc-800"
                />
                <span className="hidden md:block text-sm font-medium text-zinc-300 max-w-[100px] truncate">
                    {name}
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>

            {/* The dropdown menu (pops DOWN) */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#18181b] border border-zinc-800/80 rounded-xl shadow-lg shadow-black/50 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    <div className="px-4 py-2 border-b border-zinc-800/80 mb-1">
                        <p className="text-sm font-medium text-zinc-200 truncate">{name}</p>
                        <p className="text-xs text-zinc-500 truncate">{email}</p>
                    </div>

                    <Link
                        href="/setting"
                        className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        Account Settings
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}
