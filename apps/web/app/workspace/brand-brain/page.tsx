"use client";

import { useBrands } from "../../components/workspace/BrandProvider";
import BrandBrainPanel from "./BrandBrainPanel";

export default function BrandBrainPage() {
  const { active, loading } = useBrands();
  if (loading)
    return (
      <p role="status" className="p-8 text-sm text-zinc-500">
        Loading brand…
      </p>
    );
  if (!active)
    return (
      <p className="p-8 text-sm text-zinc-500">
        Select a brand from the sidebar to begin.
      </p>
    );
  return <BrandBrainPanel key={active.id} brandId={active.id} />;
}
