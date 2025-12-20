'use client';

import React, { useState } from 'react';
import { IoChatboxEllipsesOutline, IoClose, IoSend, IoCheckmarkCircle } from 'react-icons/io5';
import PrimaryButton from './PrimaryButton';
import posthog from 'posthog-js';

const MOODS = [
    { emoji: '🤩', label: 'Excellent', value: 'excellent' },
    { emoji: '😊', label: 'Good', value: 'good' },
    { emoji: '😐', label: 'Neutral', value: 'neutral' },
    { emoji: '😕', label: 'Bad', value: 'bad' },
];

export default function FeedbackPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [mood, setMood] = useState<string | null>(null);
    const [feedback, setFeedback] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        // Get the selected mood emoji
        const moodData = MOODS.find(m => m.value === mood);
        const moodEmoji = moodData?.emoji || '❓';
        const moodLabel = moodData?.label || 'Unknown';

        // Send to Discord webhook
        try {
            await fetch('https://discord.com/api/webhooks/1451951712326779195/BnSQIdpiUOXJDaJWhGn-t6kGif843XxXqeppfKit_4VbY5lBAFEUp0znAkxSDELQyDTn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: `${moodEmoji} New Feedback: ${moodLabel}`,
                        color: mood === 'excellent' ? 0x22c55e : mood === 'good' ? 0x3b82f6 : mood === 'neutral' ? 0xeab308 : 0xef4444,
                        fields: [
                            { name: '💬 Message', value: feedback || 'No message provided', inline: false },
                            { name: '📧 Email', value: email || 'Anonymous', inline: true },
                            { name: '🕐 Time', value: new Date().toLocaleString(), inline: true }
                        ],
                        footer: { text: 'Narrativee Feedback' }
                    }]
                })
            });
        } catch (error) {
            console.error('Failed to send feedback to Discord:', error);
        }

        setIsSending(false);
        setIsSubmitted(true);

        // PostHog: Capture feedback_submitted event
        posthog.capture('feedback_submitted', {
            mood: mood,
            mood_label: moodLabel,
            has_email: !!email,
            feedback_length: feedback.length,
        });

        // Auto close after 2 seconds on success
        setTimeout(() => {
            handleClose();
        }, 2500);
    };

    const handleClose = () => {
        setIsOpen(false);
        // Reset state after transition
        setTimeout(() => {
            setIsSubmitted(false);
            setMood(null);
            setFeedback('');
            setEmail('');
        }, 300);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-white border border-amber-200 text-gray-700 rounded-md shadow-lg hover:shadow-xl hover:border-amber-400 transition-all duration-300 group overflow-hidden"
            >
                <div className="relative">
                    <IoChatboxEllipsesOutline size={22} className="text-amber-500 group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                </div>
                <span className="font-medium text-sm" style={{ fontFamily: 'var(--font-urbanist)' }}>Feedback</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/5 animate-in fade-in duration-300"
                    onClick={handleClose}
                >
                    {/* Modal Content */}
                    <div
                        className="bg-white/80 backdrop-blur-xl border border-white/20 w-full max-w-sm mx-4 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-2">
                            <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'var(--font-petrona)' }}>
                                How are we doing?
                            </h3>
                            <button
                                onClick={handleClose}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <IoClose size={24} />
                            </button>
                        </div>

                        <div className="p-6 pt-2">
                            {!isSubmitted ? (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Mood Selector */}
                                    <div className="flex justify-between gap-2">
                                        {MOODS.map((m) => (
                                            <button
                                                key={m.value}
                                                type="button"
                                                onClick={() => setMood(m.value)}
                                                className={`flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl border transition-all duration-200 ${mood === m.value
                                                    ? 'bg-amber-50 border-amber-400 scale-105 shadow-sm'
                                                    : 'bg-gray-50/50 border-transparent hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className="text-2xl">{m.emoji}</span>
                                                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{m.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Feedback Text Area */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1">
                                            Anything to share?
                                        </label>
                                        <textarea
                                            required
                                            value={feedback}
                                            onChange={e => setFeedback(e.target.value)}
                                            placeholder="Your thoughts, bugs, or feature requests..."
                                            className="w-full min-h-[100px] p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all resize-none"
                                        />
                                    </div>

                                    {/* Optional Email */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1">
                                            Email (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="For a follow up..."
                                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-all"
                                        />
                                    </div>

                                    <PrimaryButton
                                        type="submit"
                                        disabled={!mood || !feedback || isSending}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl shadow-lg shadow-amber-200"
                                    >
                                        {isSending ? (
                                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Send Feedback</span>
                                                <IoSend size={16} />
                                            </>
                                        )}
                                    </PrimaryButton>
                                </form>
                            ) : (
                                /* Success State */
                                <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                        <IoCheckmarkCircle size={32} className="text-green-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">Thank you!</h4>
                                        <p className="text-sm text-gray-500">Your feedback helps us make Narrativee better.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
