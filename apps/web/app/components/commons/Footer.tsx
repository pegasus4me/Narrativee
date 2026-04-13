import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/Narrativee.png";

export default function Footer() {
    return (
        <footer className="py-12 px-6 border-t border-gray-100 mt-20">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <Link href="/">
                    <Image src={logo} alt="StackReach" width={100} />
                </Link>
                <div className="flex items-center gap-8 text-sm text-gray-400">
                    <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
                    <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
                    <a href="mailto:contact@narrativee.com" className="hover:text-black transition-colors">Contact</a>
                </div>
            </div>
        </footer>
    );
}
