"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBrands } from "@/app/components/workspace/BrandProvider";
import { createBrand, rememberBrand } from "@/lib/api/brands";
import { createStudioProject, listStudioProjects } from "@/lib/api/studio";

export default function StudioPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { active, loading, error: brandError, retry, select } = useBrands();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const opening = useRef<string | null>(null);
  const brandAttempt = useRef<string | null>(null);
  const [revision, setRevision] = useState(0);

  async function openProject(brandId: string) {
    const projects = await listStudioProjects(brandId);
    const project =
      projects.find(({ kind }) => kind === "creation") ??
      (await createStudioProject(brandId));
    router.replace(`/workspace/studio/${project.id}`);
  }
  useEffect(() => {
    if (
      loading ||
      !active ||
      active.provisional ||
      opening.current === active.id
    )
      return;
    opening.current = active.id;
    setBusy(true);
    setError(null);
    void openProject(active.id).catch((cause: unknown) => {
      opening.current = null;
      setBusy(false);
      setError(
        cause instanceof Error ? cause.message : "Could not open Studio",
      );
    });
  }, [active?.id, active?.provisional, loading, revision]);

  async function start() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      brandAttempt.current ??= crypto.randomUUID();
      const brand = await createBrand({
        ...(params.get("website")
          ? { url: params.get("website")! }
          : { name: "My brand" }),
        key: brandAttempt.current,
      });
      rememberBrand(brand);
      opening.current = brand.id;
      select(brand);
      await openProject(brand.id);
    } catch (cause) {
      setBusy(false);
      setError(
        cause instanceof Error ? cause.message : "Could not start your project",
      );
    }
  }
  return (
    <div className="flex h-full items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-medium tracking-tight">
          Create your first image.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Add your product, describe the scene, and refine the result in one
          workspace. Your Brand Brain can grow as you create.
        </p>
        {error || brandError ? (
          <>
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error || brandError}
            </p>
            <button
              type="button"
              onClick={() => {
                if (brandError) retry();
                else if (active) setRevision((value) => value + 1);
                else void start();
              }}
              className="mt-3 text-sm underline"
            >
              Try again
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={loading || busy}
            onClick={() => void start()}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading || busy ? "Opening Studio…" : "Create my first image"}
          </button>
        )}
      </div>
    </div>
  );
}
