import Image from "next/image";
import Link from "next/link";
import Logo from "../../../public/logo.png";

/** Top navigation for the public landing page. */
export function LandingHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white shadow-[0_0_40px_rgba(255,255,255,0.12)]">
          <Image src={Logo} alt="Narrativee" width={22} height={22} className="h-5 w-auto" priority />
        </span>
        <span className="text-sm font-semibold tracking-tight text-white">Narrativee</span>
      </Link>

      <nav className="hidden items-center gap-7 text-sm text-zinc-400 lg:flex">
        <a href="#workflow" className="transition-colors hover:text-white">Workflow</a>
        <a href="#moat" className="transition-colors hover:text-white">Moat</a>
        <a href="#channels" className="transition-colors hover:text-white">Channels</a>
      </nav>

      <div className="flex items-center gap-3">
        <Link href="/auth/signin" className="hidden text-sm font-medium text-zinc-300 transition-colors hover:text-white sm:block">
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}
