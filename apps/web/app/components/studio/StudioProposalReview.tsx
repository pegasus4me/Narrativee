import React from "react";
import type { StudioMessage } from "@/lib/api/studio";
import { campaignOutputLabel } from "@/lib/studio-outputs";
import StudioMessageMarkdown from "./StudioMessageMarkdown";

type Proposal = NonNullable<NonNullable<StudioMessage["approval"]>["proposal"]>;

export default function StudioProposalReview({
  proposal,
}: {
  proposal: Proposal;
}) {
  return (
    <div className="space-y-5" aria-label="Proposed creative direction">
      {proposal.creatives.map((creative, index) => {
        const output = proposal.outputs?.[index];
        const direction = creative.direction;
        return (
          <article key={index} className="space-y-4">
            <StudioMessageMarkdown
              content={`### ${creative.name}\n\n${creative.concept}`}
            />
            {output && (
              <p className="inline-block rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {campaignOutputLabel(output)}
              </p>
            )}
            <section
              aria-label="Image copy"
              className="rounded-lg border border-border p-3"
            >
              <h4 className="mb-2 text-xs font-medium text-foreground">
                Image copy
              </h4>
              {creative.copy.length ? (
                <div className="space-y-2">
                  <StudioMessageMarkdown content={creative.copy[0]!} />
                  {creative.copy.length > 1 && (
                    <details>
                      <summary className="cursor-pointer text-xs text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring">
                        Additional copy ({creative.copy.length - 1})
                      </summary>
                      <div className="mt-3 space-y-2">
                        {creative.copy.slice(1).map((line, copyIndex) => (
                          <StudioMessageMarkdown
                            key={copyIndex}
                            content={line}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No text</p>
              )}
            </section>
            {direction && (
              <details className="rounded-lg border border-border p-3">
                <summary className="cursor-pointer text-xs font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                  Art direction
                </summary>
                <dl className="mt-3 space-y-4">
                  {(
                    [
                      ["Subject", direction.subject],
                      ["Composition", direction.composition],
                      ["Lighting & materials", direction.lightingAndMaterials],
                      ["Typography", direction.typography],
                      ["Palette", direction.palette.join(", ")],
                      ["Avoid", direction.avoid.join("\n\n")],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt className="mb-1 text-xs font-medium text-foreground">
                        {label}
                      </dt>
                      <dd>
                        <StudioMessageMarkdown content={value} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
            <details className="rounded-lg border border-border p-3">
              <summary className="cursor-pointer text-xs font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                Full image prompt
              </summary>
              <div className="mt-3 space-y-3">
                {creative.imagePrompt.split("\n").map((line, lineIndex) => (
                  <StudioMessageMarkdown key={lineIndex} content={line} />
                ))}
              </div>
            </details>
            {Boolean(
              creative.references?.length || creative.unusedReferences?.length,
            ) && (
              <details className="rounded-lg border border-border p-3">
                <summary className="cursor-pointer text-xs font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                  Reference instructions
                </summary>
                <div className="mt-3 space-y-4">
                  {creative.references?.map((reference) => (
                    <div key={reference.id}>
                      <p className="mb-1 text-xs font-medium capitalize">
                        {reference.role} reference
                      </p>
                      <StudioMessageMarkdown content={reference.instruction} />
                    </div>
                  ))}
                  {creative.unusedReferences?.map((reference) => (
                    <div key={reference.id}>
                      <p className="mb-1 text-xs font-medium">
                        Reference left out
                      </p>
                      <StudioMessageMarkdown content={reference.reason} />
                    </div>
                  ))}
                </div>
              </details>
            )}
          </article>
        );
      })}
      <p className="text-xs leading-5 text-muted-foreground">
        Creates {proposal.creatives.length}{" "}
        {proposal.creatives.length === 1 ? "PNG" : "PNGs"} on the canvas after
        approval, with text included in the image. Sage reviews each result and
        may request one correction. Generation, reviews, and corrections use
        credits.
      </p>
    </div>
  );
}
