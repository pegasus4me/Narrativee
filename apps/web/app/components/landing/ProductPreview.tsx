import Image from "next/image";

/** Product preview showing the live Narrativee workspace. */
export function ProductPreview() {
  return (
    <div className="mt-12 w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-2 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur">
      <div className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#09090b]">
        <Image
          src="/landing-dashboard.png"
          alt="Narrativee dashboard showing the content repurposing workspace"
          width={3558}
          height={1988}
          className="h-auto w-full object-cover"
          priority
        />
      </div>
    </div>
  );
}
