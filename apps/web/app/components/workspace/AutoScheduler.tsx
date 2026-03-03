"use client";

import { useEffect, useState } from "react";

export default function AutoScheduler() {
    const [isExtensionReady, setIsExtensionReady] = useState(false);
    const [debugInfo, setDebugInfo] = useState({
        active: false,
        lastCheck: "",
        postsFound: 0,
        duePosts: 0,
        lastTrigger: "None",
        extensionDetected: false
    });

    // Listen for extension handshake
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NARRATIVEE_EXTENSION_READY') {
                setIsExtensionReady(true);
                setDebugInfo(prev => ({ ...prev, extensionDetected: true }));
            }
        };

        window.addEventListener('message', handleMessage);

        // Polling handshake trigger is usually handled by the extension
        // but we can also just wait for it.

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const checkSchedule = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString();

            const STORAGE_KEY = "narrativee_scheduler_posts_v3";
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                let postsFound = 0;
                let duePosts = 0;
                let lastTriggerValue = "None";

                if (saved) {
                    const posts = JSON.parse(saved);
                    postsFound = posts.length;

                    let hasChanges = false;

                    const updatedPosts = posts.map((post: any) => {
                        // Only look at scheduled posts
                        if (post.status !== 'scheduled') return post;
                        if (!post.time || !post.date) return post;

                        // Parse "YYYY-MM-DD" and "HH:mm"
                        const postDateTime = new Date(`${post.date}T${post.time}`);

                        if (isNaN(postDateTime.getTime())) return post;

                        // Check if it's time
                        if (postDateTime <= now) {
                            duePosts++;

                            // CRITICAL: Only trigger if extension is actually here
                            if (!isExtensionReady) {
                                console.warn(`⏳ AutoScheduler: Post "${post.id}" is due but extension not detected yet.`);
                                return post;
                            }

                            console.log(`🚀 AutoScheduler: Triggering post "${post.content.substring(0, 20)}..."`);
                            lastTriggerValue = `${post.time} (${post.content.substring(0, 10)}...)`;

                            // 1. Dispatch Event to Extension
                            window.postMessage({
                                type: 'NARRATIVEE_PUBLISH_POST',
                                payload: {
                                    id: post.id,
                                    content: post.content,
                                    time: post.time,
                                    date: post.date,
                                    title: 'Auto-Posted Note',
                                    isDraft: false
                                }
                            }, '*');

                            // 2. Mark as Published locally
                            hasChanges = true;
                            return { ...post, status: 'published' };
                        }

                        return post;
                    });

                    if (hasChanges) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
                        // Dispatch storage event for other components to update
                        window.dispatchEvent(new Event("storage"));
                    }
                }

                // Update Debug State
                setDebugInfo(prev => ({
                    ...prev,
                    active: true,
                    lastCheck: timeStr,
                    postsFound,
                    duePosts,
                    lastTrigger: lastTriggerValue !== "None" ? lastTriggerValue : prev.lastTrigger
                }));

            } catch (e) {
                console.error("AutoScheduler error", e);
            }
        };

        // Run immediately
        checkSchedule();

        // Run every 10 seconds (5s was a bit aggressive for background check)
        const interval = setInterval(checkSchedule, 10000);

        return () => clearInterval(interval);
    }, [isExtensionReady]); // Re-run effect when extension state changes

    // Run silently in background
    return null;
}
