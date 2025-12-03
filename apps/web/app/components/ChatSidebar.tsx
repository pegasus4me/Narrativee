"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Upload } from "clicons-react";
import { LexicalEditor } from "lexical";
import { authClient } from "../../lib/auth-client";
import { reportApi } from "../../lib/apis";
import Markdown from "markdown-to-jsx";
import { sendGTMEvent } from "../../lib/gtm";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "question" | "edit" | "upload";
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  reportContent: string;
  reportId: string;
  editor: LexicalEditor | null;
  onContentInsert?: (content: string, position: "end" | "cursor") => void;
}

export function ChatSidebar({ isOpen, onClose, reportContent, reportId, editor, onContentInsert }: ChatSidebarProps) {
  const { data: session, isPending } = authClient.useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: session?.user
        ? "Hi! I can help you:\n• Answer questions about your report\n• Add new sections or insights\n• Upload new data to regenerate the report\n\nWhat would you like to do?"
        : "Please log in to use the chat feature. Chat allows you to:\n• Ask questions about your report\n• Request new sections\n• Upload data to regenerate content",
      timestamp: new Date(),
      type: "question",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"question" | "edit">("question");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSendTimeRef = useRef<number>(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setUploadedFile(file);
      const message: Message = {
        role: "user",
        content: `Uploaded: ${file.name}`,
        timestamp: new Date(),
        type: "upload",
      };
      setMessages((prev) => [...prev, message]);
    } else {
      alert("Please upload a valid CSV file");
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    // Check if user is authenticated
    if (!session?.user) {
      const errorMessage: Message = {
        role: "assistant",
        content: "Please log in to use the chat feature. Click the login button to get started.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Debounce: Prevent rapid-fire requests (min 500ms between sends)
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTimeRef.current;

    if (timeSinceLastSend < 500) {
      console.log("⏱️ Debouncing: Too fast, waiting...");

      // Clear any existing timeout
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }

      // Schedule send after 500ms
      sendTimeoutRef.current = setTimeout(handleSend, 500 - timeSinceLastSend);
      return;
    }

    lastSendTimeRef.current = now;

    const requestType = uploadedFile ? "upload" : mode;

    const userMessage: Message = {
      role: "user",
      content: input.trim() || (uploadedFile ? `Process ${uploadedFile.name}` : ""),
      timestamp: new Date(),
      type: requestType,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    const currentFile = uploadedFile;
    setInput("");
    setUploadedFile(null);
    setIsLoading(true);

    sendGTMEvent('talk_with_ai', {
      type: requestType,
      hasFile: !!uploadedFile
    });

    try {
      let data: any;

      if (requestType === "upload") {
        // Handle file upload + regeneration
        data = await reportApi.regenerateReport({
          file: currentFile!,
          question: currentInput,
          reportId,
          reportContent,
        });

        if (data.success && data.newContent && onContentInsert) {
          onContentInsert(data.newContent, "end");
        }
      } else {
        // Handle question or edit request
        data = await reportApi.chat({
          question: currentInput,
          reportContent,
          reportId,
          requestType: requestType as "question" | "edit",
        });

        // If it's an edit request and we got content, insert it
        if (requestType === "edit" && data.generatedContent && onContentInsert) {
          onContentInsert(data.generatedContent, "end");
        }
      }

      const aiMessage: Message = {
        role: "assistant",
        content: data.answer || data.message || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
        type: requestType,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);

      // Handle 401 Unauthorized specifically
      const errorContent = error.message?.includes("401") || error.message?.includes("Authentication required")
        ? "Your session has expired. Please log in again to use the chat feature."
        : "Sorry, I encountered an error. Please try again.";

      const errorMessage: Message = {
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 h-screen bg-white border-l border-gray-200 transition-all duration-300 ease-in-out z-40 flex flex-col ${isOpen ? "w-96" : "w-0"
        }`}
      style={{ overflow: isOpen ? "visible" : "hidden" }}
    >

      <header className="p-2 mt-3 border-b border-gray-200">
        <div className="flex items-center gap-2" >
          <Sparkles strokeWidth={1.5} size={19} className="text-amber-600" />
          <p style={{ fontFamily: 'var(--font-petrona)' }} className="text-xl">Assistant</p>
        </div>
      </header>
      {/* Collapse/Expand Button */}
      <button
        onClick={onClose}
        className={`
          fixed top-1/2 -translate-y-1/2 z-50
          transition-all duration-300 bg-neutral-100 h-20 rounded-l-md
          ${isOpen ? 'right-96' : 'right-0 hidden'}
        `}
        aria-label="Close chat"
      >
        <svg
          className="w-4 h-4 text-gray-600 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {isOpen && (
        <>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${message.role === "user"
                    ? "bg-amber-400/40 text-black"
                    : "text-gray-900"
                    }`}
                  style={{ fontFamily: 'var(--font-noto)' }}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    <Markdown options={{
                      overrides: {
                        p: { component: 'p', props: { className: 'mb-2 last:mb-0' } },
                        a: { component: 'a', props: { className: 'text-blue-600 hover:underline', target: '_blank' } },
                        ul: { component: 'ul', props: { className: 'list-disc ml-4 mb-2' } },
                        ol: { component: 'ol', props: { className: 'list-decimal ml-4 mb-2' } },
                        li: { component: 'li', props: { className: 'mb-1' } },
                        code: { component: 'code', props: { className: 'bg-black/10 rounded px-1 py-0.5 font-mono text-xs' } },
                      }
                    }}>
                      {message.content}
                    </Markdown>
                  </div>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg p-3">
                  <p className="text-sm text-gray-600">Thinking...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border border-gray-200 bg-[#FBFBFB] rounded-t-2xl">
            {!session?.user ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-3">
                  Please log in to use the chat feature
                </p>
                <a
                  href="/auth/signin"
                  className="inline-block px-4 py-2 bg-amber-400 text-black w-3/4 border rounded-lg hover:bg-amber-500 transition-colors text-sm"
                >
                  Log In
                </a>
              </div>
            ) : (
              <>
                {uploadedFile && (
                  <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-amber-800">📎 {uploadedFile.name}</span>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-amber-600 hover:text-amber-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {/* --- Action Bar --- */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setMode("question")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === "question"
                        ? "bg-white shadow-sm text-black"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      Question
                    </button>
                    <button
                      onClick={() => setMode("edit")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === "edit"
                        ? "bg-white shadow-sm text-black"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      Edit Report
                    </button>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-400 hover:text-amber-600 transition-colors p-1.5 hover:bg-amber-50 rounded-md"
                    title="Upload CSV"
                  >
                    <Upload size={18} />
                  </button>
                </div>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question, request edits, or upload new data..."
                    className="w-full resize-none rounded-lg border border-gray-300 p-3 pr-12 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 max-h-32"
                    rows={2}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={(!input.trim() && !uploadedFile) || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2  text-black rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Upload CSV, ask questions, or request edits • Enter to send
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
