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
        <header className="p-4 flex flex-col md:flex-row justify-between items-center max-w-[70%] mx-auto gap-4 md:gap-0">
            <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-start">
                <Link href="/">
                    <Image src={logo} alt="logo" width={140} className="md:w-[170px]" />
                </Link>

                {/* Mobile Menu Button (Placeholder - for now just hiding links on mobile) */}
                <div className="flex gap-4 items-center md:hidden">
                    {/* You could add a hamburger menu here later */}
                </div>

            </div>

            <div className="flex gap-4 items-center w-full md:w-auto justify-center md:justify-end font-medium">
                <div className="hidden md:flex gap-4 items-center ml-4">
                    <Link href="/pricing" className="text-gray-700 hover:text-gray-900">Pricing</Link>
                </div>
                <div className="flex gap-4 items-center w-full md:w-auto justify-center md:justify-end">
                    {session?.user ? (
                        <ProfileMenu />
                    ) : (
                        <>
                            <a href="/auth/signin" className="text-gray-700 hover:text-gray-900 text-sm md:text-base">Login</a>
                            <PrimaryButton
                                onClick={() => {
                                    router.push('/auth/signup');
                                }}
                            >
                                Start for free
                            </PrimaryButton>
                        </>
                    )}
                </div>
            </div>

        </header>
    );
}
