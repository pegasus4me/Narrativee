import Image from "next/image";
import darkLogo from "public/logo-dark.png";
import whiteLogo from "public/logo-white.png";

export default function StudioProjectLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
      <div className="flex items-center justify-center">
        <Image
          src={darkLogo}
          alt="Narrativee"
          width={160}
          height={32}
          className="h-7 w-auto object-contain dark:hidden"
          priority
        />
        <Image
          src={whiteLogo}
          alt="Narrativee"
          width={160}
          height={32}
          className="hidden h-7 w-auto object-contain dark:block"
          priority
        />
      </div>
    </div>
  );
}
