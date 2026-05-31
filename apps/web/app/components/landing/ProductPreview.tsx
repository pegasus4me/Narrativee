import Image from "next/image";
import dashboardpreview from "@/public/dashboard.png"

/** Product preview showing the live Narrativee workspace. */
export function ProductPreview() {
  return (
    <div className="mt-12">
      <div className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#09090b]">
        <Image
          src={dashboardpreview}
          alt="Narrativee dashboard showing the content repurposing workspace"
          width={3558}
          height={1988}
          className=""
          priority
        />
      </div>
    </div>
  );
}
