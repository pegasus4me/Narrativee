"use client";

import React, { useMemo } from "react";
import {
  MessageBubble,
  MessageBubbleContent,
} from "@/components/agents/message-bubble";
import { StreamingResponse } from "@/components/agents/streaming-response";
import { Loader } from "@/components/motion/loader";
import type { AgentActivity, StudioMessage } from "@/lib/api/studio";
import StudioMessageMarkdown from "./StudioMessageMarkdown";
import StudioReplyAuthor from "./StudioReplyAuthor";
import StudioApprovalCard from "./StudioApprovalCard";

export default function StudioAgentConversation({
  messages,
  liveTeamMessages = [],
  pending,
  streamingText,
  replyingAgent,
  creatorStage,
  approvalBusy = false,
  approvalError,
  onApprovalDecision,
}: {
  messages: StudioMessage[];
  liveTeamMessages?: Array<{ agent: AgentActivity["agent"]; content: string }>;
  pending: string | null;
  streamingText: string;
  replyingAgent: AgentActivity["agent"] | null;
  creatorStage: string | null;
  approvalBusy?: boolean;
  approvalError?: { messageId: string; message: string } | null;
  onApprovalDecision?: (
    message: StudioMessage,
    action: "approve" | "reject" | "refresh",
    feedback: string,
  ) => void;
}) {
  const visibleMessages = messages;
  return (
    <section
      role="region"
      aria-label="Project conversation"
      tabIndex={0}
      className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {!visibleMessages.length && !pending && (
        <div className="px-1 pb-5">
          <p className="text-sm font-medium text-foreground">
            Your creative project
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Choose your product and describe the image you want. Your results
            and changes stay here.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {useMemo(
          () =>
            visibleMessages.map((message, index) => {
              const content =
                message.role === "assistant" ? (
                  <StreamingResponse
                    key={message.id}
                    status="complete"
                    showActions={false}
                    announce={false}
                    className="px-1"
                  >
                    <StudioReplyAuthor agent={message.agent} />
                    <StudioMessageMarkdown content={message.content} />
                    <StudioApprovalCard
                      message={message}
                      busy={approvalBusy}
                      error={
                        approvalError?.messageId === message.id
                          ? approvalError.message
                          : undefined
                      }
                      onDecision={onApprovalDecision}
                    />
                  </StreamingResponse>
                ) : (
                  <MessageBubble key={message.id} align="end" variant="solid">
                    <MessageBubbleContent className="break-words bg-muted text-foreground [&>span:first-child]:bg-background">
                      <span className="whitespace-pre-wrap">
                        {message.content}
                      </span>
                    </MessageBubbleContent>
                  </MessageBubble>
                );
              return message.role === "assistant" &&
                !message.approval &&
                visibleMessages[index + 1]?.role === "assistant" ? (
                <details
                  key={message.id}
                  className="text-xs text-muted-foreground"
                >
                  <summary className="cursor-pointer">
                    Agent work details
                  </summary>
                  {content}
                </details>
              ) : (
                content
              );
            }),
          [visibleMessages, approvalBusy, approvalError, onApprovalDecision],
        )}
        {pending && (
          <>
            <MessageBubble align="end" variant="solid" animateIn>
              <MessageBubbleContent className="whitespace-pre-wrap break-words bg-muted text-foreground [&>span:first-child]:bg-background">
                {pending}
              </MessageBubbleContent>
            </MessageBubble>
            {liveTeamMessages.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Creation details</summary>
                {liveTeamMessages.map((message, index) => (
                  <div key={index} className="mt-3">
                    <StudioReplyAuthor agent={message.agent} />
                    <StudioMessageMarkdown content={message.content} />
                  </div>
                ))}
              </details>
            )}
            <StreamingResponse
              status="streaming"
              showActions={false}
              announce={Boolean(streamingText)}
              className="px-1"
            >
              <StudioReplyAuthor agent={replyingAgent} />
              {streamingText ? (
                <StudioMessageMarkdown content={streamingText} />
              ) : (
                <div className="flex items-center gap-2 text-xs text-foreground  ">
                  <Loader variant="dither" size={18} label="Thinking" />
                  <span>{creatorStage ?? "Preparing your creative…"}</span>
                </div>
              )}
            </StreamingResponse>
          </>
        )}
      </div>
    </section>
  );
}
