"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { $getRoot, $getSelection } from "lexical";
import React, { useEffect, useState, useRef } from "react";
import Toolbar from "./Toolbar";
import { CollapsibleNode } from "../editor/nodes/CollapsibleNode";
import { ChartNode } from "../editor/nodes/ChartNode";
import { Share4, UserAdd, Sparkles } from "clicons-react";
import { parseMarkdown } from "../../../../lib/parseMarkdown";
import { useSideBarStore } from "../../../state/logo-transition/SideBar.store";
import sideLogo from "../../../../public/sidelogo.png";
import Image from "next/image";
import { reportApi } from "../../../../lib/apis";
import { authClient } from "../../../../lib/auth-client";
import { ChatSidebar } from "../../../components/ChatSidebar";
import PrimaryButton from "../../../components/PrimaryButton";

interface Template {
    id: string;
    name: string;
    description: string;
    markdown: string;
}

interface ReportEditorProps {
    template: Template;
    reportId: string;
    readOnly?: boolean;
}

// Custom Error Boundary Component
class CustomErrorBoundary extends React.Component<
    { children: React.ReactElement; onError: (error: Error) => void },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
        if (this.props.onError) {
            this.props.onError(error);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-600 font-medium">Error loading editor</p>
                    <p className="text-sm text-red-500 mt-1">
                        {this.state.error?.message || "Unknown error"}
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}

// Initialize editor with template content
function InitialContentPlugin({ template }: { template: Template }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!template?.markdown) return;

        try {
            const isLexicalJSON = template.markdown.trim().startsWith("{") &&
                template.markdown.includes('"root"');

            if (isLexicalJSON) {
                queueMicrotask(() => {
                    const editorState = editor.parseEditorState(template.markdown);
                    editor.setEditorState(editorState);
                });
            } else {
                editor.update(() => {
                    const root = $getRoot();
                    root.clear();
                    const nodes = parseMarkdown(template.markdown);
                    nodes.forEach((node) => root.append(node));
                });
            }
        } catch (error) {
            console.error("Error loading content:", error);
        }
    }, [editor, template]);

    return null;
}

// Auto-save plugin with debouncing
function AutoSavePlugin({
    reportId,
    session,
    setIsSaving,
    setLastSaved,
}: {
    reportId: string;
    session: any;
    setIsSaving: (val: boolean) => void;
    setLastSaved: (date: Date | null) => void;
}) {
    const [editor] = useLexicalComposerContext();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isValidUUID = (id: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    };

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            const serialized = JSON.stringify(editorState.toJSON());
            localStorage.setItem(`report-content-${reportId}`, serialized);

            if (!session?.user || !isValidUUID(reportId)) return;

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    setIsSaving(true);
                    const markdownContent = JSON.stringify(editorState.toJSON());
                    await reportApi.updateReport(reportId, { markdownContent });
                    setLastSaved(new Date());
                } catch (error) {
                    console.error("Auto-save failed:", error);
                } finally {
                    setIsSaving(false);
                }
            }, 2000);
        });
    }, [editor, reportId, session, setIsSaving, setLastSaved]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    return null;
}

// Capture editor instance
function EditorRefPlugin({ editorRef }: { editorRef: React.MutableRefObject<any> }) {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        editorRef.current = editor;
    }, [editor, editorRef]);
    return null;
}

export default function ReportEditor({ template, reportId, readOnly = false }: ReportEditorProps) {
    const isOpened = useSideBarStore((state) => state.opened);
    const { data: session } = authClient.useSession();

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [reportName, setReportName] = useState(template.name);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [viewCount, setViewCount] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const nameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const editorRef = useRef<any>(null);

    const initialConfig = {
        namespace: "NarrativeeEditor",
        theme: {
            paragraph: "text-lg text-gray-600 mb-6 p-2",
            heading: {
                h1: "text-6xl font-bold text-black-900 mb-6 mt-8",
                h2: "text-3xl font-bold text-gray-800 mb-4 mt-6",
                h3: "text-xl font-semibold text-gray-900 mb-3 mt-4",
            },
            text: {
                bold: "font-medium",
                italic: "italic",
                underline: "underline",
                code: "bg-gray-100 rounded px-1.5 py-0.5 font-mono text-sm text-red-600",
            },
            quote: "my-6 p-6 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg text-gray-900 font-medium",
            link: "text-amber-600 hover:text-amber-700 underline cursor-pointer",
            list: {
                ul: "list-disc list-inside ml-4 mb-4 text-gray-700",
                ol: "list-decimal list-inside ml-4 mb-4 text-gray-700",
                listitem: "mb-2",
            },
            code: "bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm my-4 overflow-x-auto",
        },
        onError: (error: Error) => console.error("Lexical Error:", error),
        nodes: [
            HeadingNode,
            QuoteNode,
            CollapsibleNode,
            LinkNode,
            AutoLinkNode,
            ChartNode,
            ListNode,
            ListItemNode,
            CodeNode,
            CodeHighlightNode,
        ],
    };

    const isValidUUID = (id: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    };

    const handleNameChange = (newName: string) => {
        setReportName(newName);
        if (!session?.user || !isValidUUID(reportId)) return;

        if (nameTimeoutRef.current) clearTimeout(nameTimeoutRef.current);

        nameTimeoutRef.current = setTimeout(async () => {
            try {
                await reportApi.updateReport(reportId, { name: newName });
            } catch (error) {
                console.error("Failed to update report name:", error);
            }
        }, 1000);
    };

    const handleShare = async () => {
        if (!session?.user || !isValidUUID(reportId)) {
            alert("Please save your report first to share it.");
            return;
        }

        setShowShareModal(true);
        setIsGeneratingLink(true);

        try {
            const { shareUrl: url } = await reportApi.generateShareLink(reportId);
            setShareUrl(url);
            const report = await reportApi.getReportById(reportId);
            setViewCount(report.viewCount || 0);
        } catch (error) {
            console.error("Failed to generate share link:", error);
            alert("Failed to generate share link. Please try again.");
            setShowShareModal(false);
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert("Link copied to clipboard!");
        } catch (error) {
            alert("Failed to copy link. Please copy manually.");
        }
    };

    const handleContentInsert = (content: string, position: "end" | "cursor") => {
        if (!editorRef.current) return;

        editorRef.current.update(() => {
            const root = $getRoot();
            const newNodes = parseMarkdown(content);

            if (position === "end") {
                newNodes.forEach((node) => root.append(node));
            } else {
                const selection = $getSelection();
                if (selection) {
                    newNodes.forEach((node) => selection.insertNodes([node]));
                }
            }
        });
    };

    useEffect(() => {
        return () => {
            if (nameTimeoutRef.current) clearTimeout(nameTimeoutRef.current);
        };
    }, []);

    return (
        <div className="h-full w-full overflow-y-auto">
            {!readOnly && (
                <header className="sticky top-0 z-10 p-3 bg-transparent backdrop-blur-md">
                    <div className="flex justify-between">
                        <div className="flex items-center gap-5">
                            {!isOpened && (
                                <>
                                    <Image src={sideLogo} alt="sidelogo" width={30} />
                                    <span className="font-medium text-sm text-amber-400">/</span>
                                    <input
                                        type="text"
                                        value={reportName}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        placeholder="report name"
                                        className="p-1 focus:outline-0 rounded-md"
                                    />
                                </>
                            )}

                            <div className="flex items-center gap-2 text-sm">
                                {session?.user ? (
                                    <>
                                        {isSaving ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-gray-600">Saving...</span>
                                            </>
                                        ) : lastSaved ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                                <span className="text-gray-600">
                                                    Saved {new Date(lastSaved).toLocaleTimeString()}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-gray-400" />
                                                <span className="text-gray-600">Ready</span>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-gray-600">Not saved (login to save)</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <Sparkles size={17} />
                                Ask AI
                            </button>
                            <button className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                                <UserAdd size={17} />
                                Collaborate
                            </button>
                            <PrimaryButton
                                className="px-4 py-2 flex items-center gap-2"
                                onClick={handleShare}
                            >
                                <Share4 size={17} />
                                Share page
                            </PrimaryButton>
                        </div>
                    </div>
                </header>
            )}

            <div
                className={`mx-auto transition-all duration-300 ${isChatOpen
                    ? "max-w-[70%]"
                    : readOnly
                        ? "max-w-[60%]"
                        : isOpened
                            ? "max-w-[60%]"
                            : "max-w-[60%]"
                    }`}
                style={{ marginRight: isChatOpen ? "400px" : "auto" }}
            >
                <LexicalComposer initialConfig={{ ...initialConfig, editable: !readOnly }}>
                    {!readOnly && <Toolbar />}

                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable className="outline-none focus:outline-none min-h-screen px-4 lexical-editor-content" />
                        }
                        placeholder={
                            !readOnly ? (
                                <div className="relative top-0 text-gray-400 pointer-events-none">
                                    Start editing your report...
                                </div>
                            ) : null
                        }
                        ErrorBoundary={CustomErrorBoundary}
                    />

                    <InitialContentPlugin template={template} />
                    <EditorRefPlugin editorRef={editorRef} />
                    {!readOnly && (
                        <AutoSavePlugin
                            reportId={reportId}
                            session={session}
                            setIsSaving={setIsSaving}
                            setLastSaved={setLastSaved}
                        />
                    )}
                    {!readOnly && <HistoryPlugin />}
                    <ListPlugin />
                    <LinkPlugin />
                </LexicalComposer>
            </div>

            {showShareModal && (
                <div
                    className="fixed inset-0 bg-transparent backdrop-blur-2xl flex items-center justify-center z-50"
                    onClick={() => setShowShareModal(false)}
                >
                    <div
                        className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Share Report</h3>

                        {isGeneratingLink ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                <span className="ml-3 text-gray-600">Generating share link...</span>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 mb-4">
                                    Anyone with this link can view your report (read-only)
                                </p>

                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                                    />
                                    <button
                                        onClick={copyShareLink}
                                        className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                                    >
                                        Copy
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 px-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                    <span>
                                        {viewCount} {viewCount === 1 ? "view" : "views"}
                                    </span>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <ChatSidebar
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                reportContent={template.markdown}
                reportId={reportId}
                editor={editorRef.current}
                onContentInsert={handleContentInsert}
            />
        </div>
    );
}