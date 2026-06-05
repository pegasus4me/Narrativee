"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { useArticleStrategyChat } from "@/app/hooks/api/useArticles";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface StrategyAgentChatProps {
  article: { id: string; title: string } | null;
  onBack: () => void;
  onContinue: (userGoals: string) => void;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! I'm your Content Strategy Agent. I've read your newsletter issue. To help me plan the perfect social pack, could you tell me: What is your primary goal? Who is your target audience? And are there specific angles or takeaways you want to focus on?",
};

export function StrategyAgentChat({ article, onBack, onContinue }: StrategyAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useArticleStrategyChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!article) return null;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || chatMutation.isPending) return;

    const userMessage: Message = { role: "user", content: trimmedInput };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");

    try {
      // Send the entire conversation history (excluding system level messages if none)
      const result = await chatMutation.mutateAsync({
        articleId: article.id,
        messages: nextMessages,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I ran into an error trying to process that. Please try sending your message again.",
        },
      ]);
    }
  };

  const handleContinue = () => {
    const transcript = messages
      .map((msg) => `[${msg.role === "user" ? "User" : "Strategy Agent"}]: ${msg.content}`)
      .join("\n\n");
    onContinue(transcript);
  };

  return (
    <div className="min-w-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to articles
      </button>

      <div>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl text-zinc-100">
          Chat with Content Strategy Agent
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Discuss your campaign goals, target audience, and preferred angles.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 text-sm text-zinc-300 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-[#eca8d6] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">How this works:</span> Chat with the Strategy Agent to define your goals (e.g. increase views/subs, target founders) and angles. Once you have a strategy you like, click <strong className="text-white">"Continue to channels"</strong> at the bottom of the page to generate your platform-native drafts.
        </div>
      </div>

      {/* Chat Container */}
      <div className="relative flex flex-col h-[480px] rounded-none border border-white/10 backdrop-blur-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 border border-brand/20 overflow-hidden">
              <img src="/content_strategist.png" alt="Content Strategist" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">@Josh-Content Strategy Agent</p>
              <p className="text-[12px] text-[#eca8d6] font-light">Active Session</p>
            </div>
          </div>
          <div className="text-xs text-zinc-500 truncate max-w-[200px] sm:max-w-xs font-mono">
            Article: {article.title}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, index) => {
            const isAgent = msg.role === "assistant";
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${isAgent ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border text-xs overflow-hidden ${isAgent
                    ? "border-zinc-800"
                    : "bg-[#eca8d6]/10 border-[#eca8d6]/20 text-[#eca8d6]"
                    }`}
                >
                  {isAgent ? (
                    <img src="/content_strategist.png" alt="Content Strategist" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>

                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isAgent
                    ? "bg-zinc-900/50 border border-white/5 text-zinc-200 rounded-tl-none"
                    : "bg-[#eca8d6]/10 border border-[#eca8d6]/20 text-zinc-100 rounded-tr-none"
                    }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {chatMutation.isPending && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 overflow-hidden">
                <img src="/content_strategist.png" alt="Content Strategist" className="h-full w-full object-cover" />
              </div>
              <div className="rounded-2xl px-4 py-3 text-sm bg-zinc-900/50 border border-white/5 text-zinc-400 rounded-tl-none flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-[#eca8d6]" />
                Strategy Agent is thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/[0.01]">
          <div className="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-brand/40 transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask questions or tell the agent what to focus on..."
              disabled={chatMutation.isPending}
              className="flex-1 bg-transparent px-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || chatMutation.isPending}
              className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:hover:bg-zinc-900"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-white/10 pt-6">
        <p className="text-xs text-zinc-500 font-mono">
          Conversation will guide draft variants.
        </p>
        <button
          type="button"
          onClick={handleContinue}
          disabled={chatMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4 text-[#eca8d6]" />
          Continue to channels
        </button>
      </div>
    </div>
  );
}
