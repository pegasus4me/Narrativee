"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBrands } from "@/app/components/workspace/BrandProvider";
import { openStudioProject } from "@/lib/api/studio";

export default function StudioPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { active, loading, error: brandError } = useBrands();
  const requestedBrandId = params.get("brandId");
  const brandId = requestedBrandId ?? active?.id;
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (loading || !brandId || active?.id !== brandId || active.provisional)
      return;
    const controller = new AbortController();
    setError(null);
    openStudioProject(brandId, controller.signal)
      .then((project) => router.replace(`/workspace/studio/${project.id}`))
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "Could not open Studio",
          );
      });
    return () => controller.abort();
  }, [active?.id, active?.provisional, brandId, loading, revision, router]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8 text-center">
      {error || brandError ? (
        <>
          <p role="alert" className="text-sm text-destructive">
            {error || brandError}
          </p>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => setRevision((value) => value + 1)}
          >
            Try again
          </button>
        </>
      ) : !brandId ? (
        <p className="text-sm text-ink-2">
          Add a brand from the sidebar to begin.
        </p>
      ) : (
        <p role="status" className="text-sm text-ink-2">
          Opening Studio…
        </p>
      )}
    </div>
  );
}
