"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ImagePlus, UserPlus, X } from "lucide-react";
import { useBrands } from "@/app/components/workspace/BrandProvider";
import {
    confirmCompetitors,
    getDiscoveryMessages,
    getSiteAnalysis,
    sendDiscoveryMessage,
    type AnalysisStatus,
    type DiscoveryMessage,
    type SiteAnalysis,
} from "@/lib/api/analysis";
import { StreamingResponse } from "@/components/agents/streaming-response";
import { PromptInput } from "@/components/agents/prompt-input";
import { Loader } from "@/components/motion/loader";

const activeAnalysisStatuses = new Set<AnalysisStatus>([
    "queued",
    "scraping",
    "synthesizing",
    "discovering_competitors",
    "scanning_competitors",
    "comparing_competitors",
]);

function progressMessage(status: AnalysisStatus, brandName: string): string {
    switch (status) {
        case "queued":
            return `I’m preparing to explore ${brandName}.`;
        case "scraping":
            return `I’m reading ${brandName}’s website and collecting its visible brand signals.`;
        case "synthesizing":
            return `I’m turning the website into an initial understanding of ${brandName}’s product, voice, and positioning.`;
        case "discovering_competitors":
            return "I’m mapping the surrounding market to find relevant brand references and competitors.";
        case "scanning_competitors":
            return "I’m reading the selected competitor websites to understand their positioning and visual language.";
        case "comparing_competitors":
            return `I’m comparing the brand landscape to identify distinct directions for ${brandName}.`;
        case "failed":
        case "competitor_analysis_failed":
            return "I couldn’t finish this exploration.";
        default:
            return `I’ve finished the initial exploration for ${brandName}.`;
    }
}

function DiscoveryActivity({
    analysis,
    brandName,
}: {
    analysis: SiteAnalysis;
    brandName: string;
}) {
    const running = activeAnalysisStatuses.has(analysis.status);
    const failed =
        analysis.status === "failed" ||
        analysis.status === "competitor_analysis_failed";

    return (
        <section className="mx-auto flex w-full max-w-2xl items-start gap-3 pt-20 sm:pt-28">
            <Loader
                variant={running ? "dots" : failed ? "ascii-line" : "morph"}
                size={22}
                label={running ? "Narrativee is exploring your brand" : "Discovery status"}
                className={failed ? "text-destructive" : "text-ink"}
            />
            <StreamingResponse
                status={failed ? "error" : running ? "streaming" : "complete"}
                showActions={false}
                announce
                contentClassName={failed ? "text-destructive" : "text-ink"}
            >
                {analysis.error || progressMessage(analysis.status, brandName)}
            </StreamingResponse>
        </section>
    );
}

function CompetitorFollowUp({
    analysis,
    onStarted,
}: {
    analysis: SiteAnalysis;
    onStarted: () => void;
}) {
    const [selected, setSelected] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const candidates = analysis.competitorCandidates ?? [];

    if (
        analysis.status !== "awaiting_competitor_confirmation" ||
        candidates.length === 0
    ) {
        return null;
    }

    function toggle(url: string) {
        setSelected((current) =>
            current.includes(url)
                ? current.filter((item) => item !== url)
                : current.length < 5
                    ? [...current, url]
                    : current,
        );
    }

    async function continueDiscovery() {
        if (!selected.length || busy) return;
        setBusy(true);
        setError(null);
        try {
            await confirmCompetitors(analysis.id, selected);
            onStarted();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Unable to continue discovery",
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="border-t border-line pt-6">
            <h3 className="text-lg font-semibold text-ink">Continue the exploration</h3>
            <p className="mt-2 text-sm leading-6 text-ink-2">
                Choose the competitors that feel most relevant. Narrativee will compare
                their positioning, voice, and visual language next.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
                {candidates.map((candidate) => {
                    const checked = selected.includes(candidate.url);
                    return (
                        <label
                            key={candidate.url}
                            className="flex cursor-pointer gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-hover-2"
                        >
                            <input
                                type="checkbox"
                                checked={checked}
                                disabled={busy || (!checked && selected.length >= 5)}
                                onChange={() => toggle(candidate.url)}
                                className="mt-1 accent-black"
                            />
                            <span className="min-w-0">
                                <span className="block text-sm font-medium text-ink">
                                    {candidate.name}
                                </span>
                                <span className="block truncate text-xs text-ink-3">
                                    {candidate.url}
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-ink-2">
                                    {candidate.reason}
                                </span>
                            </span>
                        </label>
                    );
                })}
            </div>
            {error && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                    {error}
                </p>
            )}
            <button
                type="button"
                disabled={!selected.length || busy}
                onClick={() => void continueDiscovery()}
                className="mt-4 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
                {busy ? "Starting comparison…" : "Compare selected competitors"}
            </button>
        </section>
    );
}

function DiscoveryResult({
    analysis,
    brandName,
    onCompetitorAnalysisStarted,
    messages,
    onSend,
    sending,
}: {
    analysis: SiteAnalysis;
    brandName: string;
    onCompetitorAnalysisStarted: () => void;
    messages: DiscoveryMessage[];
    onSend: (text: string, attachments: File[]) => Promise<void>;
    sending: boolean;
}) {
    const diagnosis = analysis.diagnosis;

    if (!diagnosis) return null;

    return (
        <section className="mx-auto w-full max-w-3xl space-y-8 py-10">
            <div className="p-5 sm:p-7">
                <p className="text-sm text-ink-3">Your designer</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Let’s shape {brandName}&apos;s visual direction</h2>
                <StreamingResponse status="complete" showActions={false} contentClassName="mt-3 text-ink">I’ve started with what your site communicates: {diagnosis.summary} I’m looking at the visual choices in your category too—not to copy them, but to find a direction that feels right for you and distinct.</StreamingResponse>
                {diagnosis.inferences.slice(0, 3).map((inference) => <p key={inference.type} className="mt-3 text-sm leading-6 text-ink-2"><span className="font-medium capitalize text-ink">{inference.type}: </span>{inference.statement}</p>)}
                {diagnosis.openQuestions[0] && <p className="mt-5 text-sm font-medium text-ink">{diagnosis.openQuestions[0].question}</p>}
                {diagnosis.openQuestions[0]?.options.length ? <div className="mt-3 flex flex-wrap gap-2">{diagnosis.openQuestions[0].options.map((option) => <button key={option} type="button" onClick={() => void onSend(option, [])} disabled={sending} className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-2 hover:bg-hover-2 disabled:opacity-50">{option}</button>)}</div> : null}
            </div>
            {analysis.competitorAnalysis?.visualReferences?.length ? <section>
                <div className="mb-3"><h3 className="text-lg font-semibold text-ink">Visual references from your space</h3><p className="mt-1 text-sm text-ink-3">Real competitor websites, scanned for visual cues.</p></div>
                <div className="grid gap-3 sm:grid-cols-2">{analysis.competitorAnalysis.visualReferences.map((reference) => <a key={reference.url} href={reference.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-xl bg-surface transition-colors hover:bg-hover-2">
                    {reference.screenshot && <img src={reference.screenshot} alt={`${reference.title} website`} loading="lazy" className="aspect-[16/9] w-full object-cover object-top" />}
                    <div className="p-3"><p className="flex items-center gap-1.5 text-sm font-medium text-ink">{reference.title}<ExternalLink size={12} /></p><p className="mt-1 truncate text-xs text-ink-3">{reference.url}</p>{Array.isArray((reference.branding as { colors?: unknown[] } | null)?.colors) && <div className="mt-3 flex gap-1.5">{((reference.branding as { colors: Array<{ hex?: string }> }).colors).slice(0, 8).map((color, index) => <span key={`${color.hex}-${index}`} title={color.hex} className="size-5 rounded-full border border-line" style={{ backgroundColor: color.hex }} />)}</div>}</div>
                </a>)}</div>
            </section> : null}
            {analysis.competitorAnalysis?.competitors.map((competitor) => <article key={competitor.url} className="py-3"><h3 className="text-sm font-semibold text-ink">{competitor.name} — visual cues</h3><div className="mt-2 flex flex-wrap gap-2">{competitor.visualPatterns.map((pattern) => <span key={pattern} className="rounded-full bg-hover-2 px-2.5 py-1 text-xs text-ink-2">{pattern}</span>)}</div></article>)}
            {messages.map((message) => <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-2xl bg-secondary px-4 py-3 text-sm text-ink" : "max-w-[90%] py-2 text-sm leading-6 text-ink"}>{message.role === "assistant" ? <StreamingResponse status="complete" showActions={false}>{message.content}</StreamingResponse> : message.content}</div>)}
            <CompetitorFollowUp analysis={analysis} onStarted={onCompetitorAnalysisStarted} />
        </section>
    );
}

export default function DiscoveryPage() {
    const { active, legacyId, loading: brandsLoading, error: brandError } =
        useBrands();
    const analysisId = active?.analysisId ?? legacyId;
    const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(Boolean(analysisId));
    const [analysisRevision, setAnalysisRevision] = useState(0);
    const [messages, setMessages] = useState<DiscoveryMessage[]>([]);
    const [sending, setSending] = useState(false);
    const [conversationError, setConversationError] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const analysisIsActive = Boolean(
        analysis && activeAnalysisStatuses.has(analysis.status),
    );
    const analysisFailed = Boolean(
        analysis &&
        (analysis.status === "failed" ||
            analysis.status === "competitor_analysis_failed"),
    );
    const analysisHasResult = Boolean(
        analysis?.diagnosis && !analysisIsActive && !analysisFailed,
    );

    useEffect(() => {
        if (!analysisId) {
            setAnalysis(null);
            setAnalysisError(null);
            setAnalysisLoading(false);
            return;
        }

        const currentAnalysisId = analysisId;
        let cancelled = false;
        let timer: number | undefined;

        async function loadAnalysis() {
            try {
                const nextAnalysis = await getSiteAnalysis(currentAnalysisId);
                if (cancelled) return;
                setAnalysis(nextAnalysis);
                setAnalysisError(null);

                if (activeAnalysisStatuses.has(nextAnalysis.status)) {
                    timer = window.setTimeout(loadAnalysis, 1800);
                }
            } catch (cause) {
                if (!cancelled) {
                    setAnalysisError(
                        cause instanceof Error
                            ? cause.message
                            : "Unable to load this discovery",
                    );
                }
            } finally {
                if (!cancelled) setAnalysisLoading(false);
            }
        }

        setAnalysis(null);
        setAnalysisError(null);
        setAnalysisLoading(true);
        void loadAnalysis();

        return () => {
            cancelled = true;
            if (timer) window.clearTimeout(timer);
        };
    }, [analysisId, analysisRevision]);

    useEffect(() => {
        if (!analysisId || !analysisHasResult) { setMessages([]); return; }
        let cancelled = false;
        void getDiscoveryMessages(analysisId).then((loaded) => { if (!cancelled) setMessages(loaded); }).catch((cause) => { if (!cancelled) setConversationError(cause instanceof Error ? cause.message : "Unable to load the conversation"); });
        return () => { cancelled = true; };
    }, [analysisId, analysisHasResult]);

    async function sendMessage(text: string, files: File[] = []) {
        if (!analysisId || sending) return;
        setSending(true); setConversationError(null);
        const temporaryId = `pending-${Date.now()}`;
        setMessages((current) => [...current, { id: temporaryId, role: "user", content: text, createdAt: new Date().toISOString() }]);
        try {
            const images = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read inspiration image"));
                reader.onerror = () => reject(new Error("Unable to read inspiration image"));
                reader.readAsDataURL(file);
            })));
            const answer = await sendDiscoveryMessage(analysisId, text, images);
            setMessages((current) => [...current.filter((message) => message.id !== temporaryId), { id: `assistant-${Date.now()}`, role: "assistant", content: answer, createdAt: new Date().toISOString() }]);
            setAttachments([]);
        } catch (cause) {
            setMessages((current) => current.filter((message) => message.id !== temporaryId));
            setConversationError(cause instanceof Error ? cause.message : "The designer agent could not reply");
        } finally { setSending(false); }
    }

    return (
        <div className="flex min-h-full w-full flex-col">
            <header className="flex w-full max-w-[95%] mx-auto items-start justify-between gap-4 mt-6">
                <div>

                    {active?.url ? (
                        <a
                            href={active.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink hover:underline"
                        >
                            {active.name}
                            <ExternalLink size={13} />
                        </a>
                    ) : active ? (
                        <p className="mt-2 text-sm text-ink-2">{active.name}</p>
                    ) : null}
                </div>

                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg  bg-secondary text-black px-3 py-1.5 text-xs font-medium shadow-sm transition-[background-color,transform] duration-150 hover:bg-hover-2 active:scale-[0.98]"
                >
                    <UserPlus size={14} className="text-black" />
                    <span>Invite collaborators</span>
                </button>
            </header>
            <div className="grid">
                <section>
                    {analysisLoading && active?.url && (
                        <section className="mx-auto flex w-full max-w-2xl items-start gap-3 pt-20 sm:pt-28">
                            <Loader
                                variant="dots"
                                size={22}
                                label="Loading discovery"
                                className="text-ink"
                            />
                            <p className="text-sm leading-6 text-ink">
                                I’m opening the brand workspace.
                            </p>
                        </section>
                    )}

                    {analysis && active && (analysisIsActive || analysisFailed) && (
                        <DiscoveryActivity analysis={analysis} brandName={active.name} />
                    )}

                    {analysis && active && analysisHasResult && (
                        <DiscoveryResult
                            analysis={analysis}
                            brandName={active.name}
                            messages={messages}
                            onSend={sendMessage}
                            sending={sending}
                            onCompetitorAnalysisStarted={() => {
                                setAnalysis((current) =>
                                    current
                                        ? {
                                            ...current,
                                            status: "scanning_competitors",
                                            progress: 0,
                                            error: null,
                                        }
                                        : current,
                                );
                                setAnalysisRevision((current) => current + 1);
                            }}
                        />
                    )}

                    {analysisError && active?.url && (
                        <p
                            role="alert"
                            className="mx-auto w-full max-w-2xl pt-20 text-sm text-destructive"
                        >
                            {analysisError}
                        </p>
                    )}

                    <div className="flex-1" />

                    <div className="sticky bottom-0 bg-background mx-auto w-full max-w-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
                        {!brandsLoading && !active && (
                            <p className="mb-3 text-sm text-ink-2">
                                {brandError || "Add a brand from the sidebar to begin."}
                            </p>
                        )}
                        <input id="discovery-inspiration" type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { const added = Array.from(event.target.files ?? []).filter((file) => file.size <= 5 * 1024 * 1024); setAttachments([...attachments, ...added].slice(0, 5)); event.target.value = ""; }} />
                        {attachments.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{attachments.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex max-w-full items-center gap-1 rounded-lg bg-hover-2 px-2 py-1 text-xs text-ink-2"><span className="max-w-40 truncate">{file.name}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}><X size={12} /></button></span>)}</div>}
                        <PromptInput aria-label="Talk to your designer" placeholder="Tell your designer what you like, dislike, or want to explore…" disabled={brandsLoading || !active || !analysisHasResult || sending} loading={sending} onSubmit={(text) => void sendMessage(text, attachments)} leadingAction={<label htmlFor="discovery-inspiration" title="Add inspiration images" className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-2 hover:bg-hover-2"><ImagePlus size={16} /></label>} minRows={2} maxRows={6} />
                        <p className="mt-2 text-center text-xs text-ink-3">Add up to 5 inspiration images, up to 5 MB each</p>
                        {conversationError && <p role="alert" className="mx-auto mb-2 max-w-2xl text-xs text-destructive">{conversationError}</p>}
                        {active && !analysisHasResult && (
                            <p className="mt-2 text-center text-xs text-ink-3">
                                {active.url ? "Your designer will be ready when the site and visual references finish scanning." : "Add a website to start a designer conversation."}
                            </p>
                        )}
                    </div>
                </section>
                <section>
                    here
                </section>
            </div>
        </div>
    );
}
