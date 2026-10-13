import Image from "next/image";
import darkLogo from "public/logo-dark.png";

export default function StudioProjectLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex items-center justify-center">
        <Image
          src={darkLogo}
          alt="Narrativee"
          width={160}
          height={32}
          className="h-7 w-auto object-contain"
          priority
        />
      </div>
    </div>
  );
}
