"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import logo from "../../../public/logoWhite.png";
import PrimaryButton from "./PrimaryButton";
import ProfileMenu from "./ProfileMenu";

export default function Header() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <header className="flex items-center justify-between mt-5 px-4 bg-tertiary md:px-6 border-t py-2">
      <div className="flex-1">
        <Image src={logo} alt="Logo" width={160} height={100} />
      </div>
      <nav className="flex-1 flex justify-center text-white items-center gap-8 text-sm font-medium font-manrope">
        <Link href="/pricing" className="hover:opacity-70">Pricing</Link>
        <Link href="/#features" className="hover:opacity-70">Features</Link>
        <Link href="/#solution" className="hover:opacity-70">Solution</Link>
        <Link href="/pricing#calculator" className="hover:opacity-70">ROI Calculator </Link>
      </nav>
      <div className="flex-1 flex justify-end gap-4 items-center">
        {session ? (
          <ProfileMenu />
        ) : (

          <>
            <Link className="text-sm font-medium text-white" href="/auth/signin">login</Link>
            <PrimaryButton onClick={() => router.push('/auth/signup')}>Get Started</PrimaryButton>
          </>
        )}
      </div>
    </header>
  );
}
