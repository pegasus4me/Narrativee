import React from "react";
import Markdown, { RuleType } from "markdown-to-jsx";

export default function StudioMessageMarkdown({
  content,
}: {
  content: string;
}) {
  return (
    <Markdown
      className="break-words text-muted-foreground [&_p]:mb-3 [&_p:last-child]:mb-0 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-current/30 [&_blockquote]:pl-3 [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_hr]:my-4 [&_hr]:border-border [&_li]:pl-0.5 [&_strong]:font-semibold"
      options={{
        disableParsingRawHTML: true,
        forceBlock: true,
        renderRule: (next, node) => {
          const rendered = next();
          return node.type === RuleType.text && typeof rendered === "string"
            ? rendered.replace(/\s*\u2014\s*/g, ", ")
            : rendered;
        },
        overrides: {
          a: {
            props: {
              target: "_blank",
              rel: "noopener noreferrer",
            },
          },
        },
      }}
    >
      {content}
    </Markdown>
  );
}
