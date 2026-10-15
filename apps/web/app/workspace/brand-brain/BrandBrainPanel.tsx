"use client";

import { useState } from "react";
import { BrandKit } from "./BrandKit";
import { BrandBrainImages } from "./BrandBrainImages";
import { BrandBrainNotes } from "./BrandBrainNotes";
import { useBrandBrain } from "./useBrandBrain";
import { BrandProducts } from "./BrandProducts";

const views = [
  { id: "kit", title: "Brand kit" },
  { id: "products", title: "Products" },
  { id: "inspiration", title: "References" },
  { id: "feedback", title: "Feedback" },
] as const;

export default function BrandBrainPanel({ brandId }: { brandId: string }) {
  const brain = useBrandBrain(brandId);
  const [selected, setSelected] = useState<(typeof views)[number]["id"]>("kit");

  return (
    <div className="min-h-full px-6 py-8 text-zinc-900 dark:text-zinc-100 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7">
          <h1 className="text-3xl font-semibold">Brand Brain</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Everything your designer should remember, in one place.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
          <nav
            aria-label="Brand Brain views"
            className="flex gap-1 overflow-x-auto md:flex-col md:self-start"
          >
            {views.map((view) => (
              <button
                key={view.id}
                type="button"
                aria-current={selected === view.id ? "page" : undefined}
                onClick={() => setSelected(view.id)}
                className={`h-10 shrink-0 rounded-lg px-3 text-left text-sm transition-colors ${selected === view.id ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-white/[0.07] dark:text-white" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:hover:bg-white/[0.03] dark:hover:text-zinc-300"}`}
              >
                {view.title}
              </button>
            ))}
          </nav>
          <div className="min-w-0">
            {brain.warning && (
              <p
                role="status"
                className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
              >
                {brain.warning}
              </p>
            )}
            {brain.error && (
              <p
                role="alert"
                className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300"
              >
                {brain.error}
              </p>
            )}
            {!brain.data && !brain.error ? (
              <p role="status" className="text-sm text-zinc-500">
                Loading brand memory…
              </p>
            ) : (
              brain.data && (
                <div key={brandId}>
                  <div hidden={selected !== "kit"}>
                    <BrandKit brain={brain} brandId={brandId} />
                  </div>
                  {selected === "products" && (
                    <BrandProducts brain={brain} brandId={brandId} />
                  )}
                  <div
                    hidden={selected !== "inspiration"}
                    className="space-y-8"
                  >
                    <p className="text-sm text-zinc-500">
                      References to explore with your designer.
                    </p>
                    <BrandBrainImages
                      brain={brain}
                      brandId={brandId}
                      purpose="inspiration"
                    />
                  </div>
                  <div hidden={selected !== "feedback"}>
                    <BrandBrainNotes
                      brain={brain}
                      kind="feedback"
                      categories={[
                        "identity",
                        "color",
                        "typography",
                        "imagery",
                        "voice",
                        "layout",
                        "other",
                      ]}
                      placeholder="What worked well? What should change next time?"
                      buttonLabel="Save feedback"
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
