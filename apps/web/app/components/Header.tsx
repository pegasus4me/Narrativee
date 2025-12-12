"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import logo from "../../public/logo.png";
import PrimaryButton from "./PrimaryButton";
import ProfileMenu from "./ProfileMenu";

export default function Header() {
    const router = useRouter();
    const { data: session } = authClient.useSession();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-transparent transition-all duration-200 ">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <Image src={logo} alt="Narrativee" width={150} priority />
                    </Link>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3 font-medium" style={{ fontFamily: 'var(--font-urbanist)' }}>
                        <div className="flex items-center gap-8">
                            <nav className="hidden md:flex items-center gap-8">
                                <Link
                                    href="/pricing"
                                    className="text-sm text-gray-600 hover:text-black transition-colors"
                                >
                                    Pricing
                                </Link>
                            </nav>
                            <nav className="hidden md:flex items-center gap-8">
                                <Link
                                    href="mailto:contact@narrativee.com"
                                    className="text-sm text-gray-600 hover:text-black transition-colors"
                                >
                                    Contact
                                </Link>
                            </nav>
                        </div>
                        {session?.user ? (
                            <ProfileMenu />
                        ) : (
                            <>
                                <Link
                                    href="/auth/signin"
                                    className="text-sm text-gray-600 hover:text-black transition-colors px-3 py-2"
                                >
                                    Log in
                                </Link>
                                <PrimaryButton onClick={() => router.push('/auth/signup')}>
                                    Get started
                                </PrimaryButton>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
