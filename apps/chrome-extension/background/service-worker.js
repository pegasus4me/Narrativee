// Background service worker - handles API calls to OpenRouter / Narrativee backend

const NARRATIVEE_API_URL = 'http://localhost:3002/api';

// ==========================================
// ALARM-BASED SCHEDULER
// ==========================================

// When the alarm fires, fetch fresh content from the API and open Substack to post it
chrome.alarms.onAlarm.addListener(async (alarm) => {
    // ── 4-hour notes performance cron ──
    if (alarm.name === 'narrativee_notes_perf_cron') {
        console.log('📝 Cron: Auto-syncing notes performance');
        const data = await chrome.storage.local.get(['narrativee_profile_url']);
        const profileUrl = data.narrativee_profile_url;
        if (!profileUrl) {
            console.warn('📝 Cron: No profileUrl stored, skipping');
            return;
        }
        const notesUrl = profileUrl.replace(/\/$/, '') + '/notes';
        chrome.tabs.create({ url: notesUrl, active: false }, (tab) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId !== tab.id || info.status !== 'complete') return;
                chrome.tabs.onUpdated.removeListener(listener);
                setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, { type: 'SCRAPE_OWN_NOTES' }, (response) => {
                        if (!chrome.runtime.lastError && response?.notes?.length) {
                            forwardToNarrativeeTab({ type: 'NARRATIVEE_NOTES_PERF_SCRAPED', notes: response.notes });
                        }
                        setTimeout(() => chrome.tabs.remove(tabId), 1000);
                    });
                }, 4000);
            });
        });
        return;
    }

    if (!alarm.name.startsWith('narrativee_post_')) return;

    const postId = alarm.name.replace('narrativee_post_', '');
    console.log('⏰ Alarm fired for post:', postId);

    // Keep the MV3 service worker alive during the entire posting flow.
    // Chrome can terminate idle service workers after ~30s; polling chrome.storage
    // prevents that while we wait for the tab to load and the post to complete.
    let keepAliveInterval = setInterval(() => {
        chrome.storage.local.get(['narrativee_keepalive'], () => {});
    }, 20000);

    const stopKeepAlive = () => clearInterval(keepAliveInterval);

    // Get auth cookie / API base from storage
    const storageData = await chrome.storage.local.get(['narrativee_api_url']);
    const apiBase = storageData.narrativee_api_url || 'https://api.narrativee.com';

    // Fetch fresh content from the backend — avoids stale snapshot bug
    let content;
    try {
        const resp = await fetch(`${apiBase}/scheduled-notes/${postId}`, { credentials: 'include' });
        if (!resp.ok) throw new Error(`API ${resp.status}`);
        const json = await resp.json();
        content = json.note?.content;
    } catch (e) {
        console.error('⏰ Could not fetch fresh content for post', postId, e);
        // Fallback to stale snapshot if API unreachable
        const data = await chrome.storage.local.get(['narrativee_scheduled_posts']);
        const scheduledPosts = data.narrativee_scheduled_posts || {};
        content = scheduledPosts[postId]?.content;
    }

    if (!content) {
        console.warn('⏰ No content found for alarm:', postId);
        stopKeepAlive();
        forwardScheduledPostResult(postId, false);
        return;
    }

    // Remove the post from local storage (it's firing now)
    const data = await chrome.storage.local.get(['narrativee_scheduled_posts']);
    const scheduledPosts = data.narrativee_scheduled_posts || {};
    delete scheduledPosts[postId];
    await chrome.storage.local.set({ narrativee_scheduled_posts: scheduledPosts });

    console.log('⏰ Posting scheduled note:', content.substring(0, 50));

    chrome.tabs.create({ url: 'https://substack.com/home' }, (tab) => {
        const postingTabId = tab?.id;
        if (!postingTabId) { stopKeepAlive(); return; }

        console.log('⏰ Opened Substack tab for scheduled post', postingTabId);

        // Listen for NOTE_POSTED / NOTE_CANCELLED from content script
        let postResolved = false;
        function onNoteResult(msg, msgSender) {
            if (msgSender.tab?.id !== postingTabId) return;

            if (msg.type === 'NOTE_POSTED') {
                postResolved = true;
                chrome.runtime.onMessage.removeListener(onNoteResult);
                clearTimeout(giveUpTimeout);
                stopKeepAlive();
                console.log('⏰ Scheduled post confirmed posted!');
                forwardScheduledPostResult(postId, 'published');
                setTimeout(() => {
                    try { chrome.tabs.remove(postingTabId); } catch (e) {}
                }, 3000);
            }

            if (msg.type === 'NOTE_CANCELLED') {
                postResolved = true;
                chrome.runtime.onMessage.removeListener(onNoteResult);
                clearTimeout(giveUpTimeout);
                stopKeepAlive();
                console.log('⏰ Scheduled post cancelled by user.');
                forwardScheduledPostResult(postId, 'cancelled');
                setTimeout(() => {
                    try { chrome.tabs.remove(postingTabId); } catch (e) {}
                }, 1000);
            }
        }
        chrome.runtime.onMessage.addListener(onNoteResult);

        // Give up after 90s
        const giveUpTimeout = setTimeout(() => {
            chrome.runtime.onMessage.removeListener(onNoteResult);
            stopKeepAlive();
            if (!postResolved) {
                console.warn('⏰ Scheduled post timed out — not confirmed');
                forwardScheduledPostResult(postId, false);
            }
        }, 90000);

        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === postingTabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                console.log('⏰ Tab loaded, waiting for React hydration then injecting...');

                // 2s delay lets Substack React finish hydrating after tab reports "complete"
                setTimeout(() => {
                    chrome.tabs.sendMessage(postingTabId, {
                        type: 'INJECT_NARRATIVEE_DRAFT',
                        draft: { content },
                        autoPost: true
                    });
                }, 2000);
            }
        });
    });
});

function forwardScheduledPostResult(postId, status) {
    chrome.tabs.query({}, (allTabs) => {
        const narrativeeTabs = allTabs.filter(t =>
            t.url && (t.url.includes('narrativee.com') || t.url.includes('localhost:3010') || t.url.includes('localhost:3000'))
        );
        narrativeeTabs.forEach(t => {
            chrome.tabs.sendMessage(t.id, {
                type: 'NARRATIVEE_SCHEDULED_POST_FIRED',
                postId,
                status  // 'published' | 'cancelled' | false (timeout)
            }, () => { if (chrome.runtime.lastError) { } });
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCHEDULE_POST') {
        const { postId, content, scheduledTimestamp, timezone } = message;
        console.log('📅 Scheduling post', postId, 'for', new Date(scheduledTimestamp).toISOString(), 'tz:', timezone);

        if (!scheduledTimestamp || scheduledTimestamp <= Date.now()) {
            console.warn('📅 Timestamp is in the past or invalid, skipping alarm');
            sendResponse({ success: false, error: 'Invalid timestamp' });
            return true;
        }

        chrome.storage.local.get(['narrativee_scheduled_posts'], (data) => {
            const scheduledPosts = data.narrativee_scheduled_posts || {};
            // Store content so it's always available at fire time, even if API is unreachable
            scheduledPosts[postId] = { postId, content, scheduledTimestamp, timezone };
            chrome.storage.local.set({ narrativee_scheduled_posts: scheduledPosts }, () => {
                const alarmName = `narrativee_post_${postId}`;
                chrome.alarms.clear(alarmName, () => {
                    chrome.alarms.create(alarmName, { when: scheduledTimestamp });
                    console.log(`📅 Alarm set for: ${new Date(scheduledTimestamp).toLocaleString()}`);
                    sendResponse({ success: true });
                });
            });
        });
        return true;
    }

    if (message.type === 'CANCEL_SCHEDULED_POST') {
        const { postId } = message;
        chrome.alarms.clear(`narrativee_post_${postId}`, () => {
            chrome.storage.local.get(['narrativee_scheduled_posts'], (data) => {
                const scheduledPosts = data.narrativee_scheduled_posts || {};
                delete scheduledPosts[postId];
                chrome.storage.local.set({ narrativee_scheduled_posts: scheduledPosts });
                sendResponse({ success: true });
            });
        });
        return true;
    }

    if (message.type === 'GENERATE_COMMENT') {

        generateComment(message.context)
            .then(comment => sendResponse({ success: true, comment }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'GENERATE_NOTE') {
        generateNote(message.topic)
            .then(note => sendResponse({ success: true, note }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    // Article Writing Assistant handlers
    if (message.type === 'WRITE_SECTION') {
        writeArticleSection(message.prompt, message.context)
            .then(content => sendResponse({ success: true, content }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'EXPAND_TEXT') {
        expandText(message.text, message.context)
            .then(content => sendResponse({ success: true, content }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'REWRITE_TEXT') {
        rewriteText(message.text, message.context)
            .then(content => sendResponse({ success: true, content }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'SUGGEST_HEADLINES') {
        suggestHeadlines(message.content)
            .then(headlines => sendResponse({ success: true, headlines }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'GENERATE_OUTLINE') {
        generateOutline(message.topic)
            .then(outline => sendResponse({ success: true, outline }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'OPEN_SUBSTACK_DRAFT') {
        console.log('🚀 Background: Received OPEN_SUBSTACK_DRAFT', message.draft);

        // Open Substack New Note/Post page directly
        chrome.tabs.create({ url: 'https://substack.com/home' }, (tab) => {
            if (chrome.runtime.lastError) {
                console.error('🚀 Background: ERROR opening tab', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                console.log('🚀 Background: Opened Substack tab', tab?.id);
                const postingTabId = tab?.id;

                // Send the draft directly to the new tab once it loads
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (tabId === postingTabId && info.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        console.log('🚀 Tab loaded, sending manual draft to inject');

                        setTimeout(() => {
                            chrome.tabs.sendMessage(postingTabId, {
                                type: 'INJECT_NARRATIVEE_DRAFT',
                                draft: message.draft,
                                autoPost: false
                            });
                        }, 2000);
                    }
                });

                // Listen for the NOTE_POSTED signal from content script (optional cleanup)
                function onNotePosted(msg, msgSender) {
                    if (msgSender.tab?.id === postingTabId && msg.type === 'NOTE_POSTED') {
                        chrome.runtime.onMessage.removeListener(onNotePosted);
                        clearTimeout(safetyTimeout);
                        console.log('🚀 Background: Note posted confirmed, will close tab in 3s');
                        setTimeout(() => {
                            try { chrome.tabs.remove(postingTabId); } catch (e) { }
                        }, 3000);
                    }
                }
                chrome.runtime.onMessage.addListener(onNotePosted);

                const safetyTimeout = setTimeout(() => {
                    chrome.runtime.onMessage.removeListener(onNotePosted);
                    console.log('🚀 Background: Posting listener expired (2min)');
                }, 120000);

                sendResponse({ success: true, tabId: postingTabId });
            }
        });
        return true;
    }

    if (message.type === 'START_NOTES_SYNC') {
        console.log('🚀 Background: Received START_NOTES_SYNC for', message.profileUrl);

        let targetUrl = message.profileUrl;
        if (!targetUrl.endsWith('/notes')) {
            targetUrl = targetUrl.replace(/\/$/, '') + '/notes';
        }

        chrome.tabs.create({ url: targetUrl, active: false }, (tab) => {
            console.log('🚀 Background: Opened notes tab', tab.id);

            // Wait for tab to load then scrape
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    console.log('🚀 Background: Tab loaded, sending scrape command');

                    chrome.tabs.sendMessage(tabId, {
                        type: 'SCRAPE_NOTES_ON_LOAD',
                        requestingTabId: sender.tab?.id
                    });
                }
            });
        });
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'NOTES_SCRAPED') {
        console.log('🚀 Background: Received scraped notes', message.notes.length);

        // Route the notes directly to the tab that requested the sync
        if (message.requestingTabId) {
            chrome.tabs.sendMessage(message.requestingTabId, {
                type: 'NARRATIVEE_NOTES_SYNCED',
                notes: message.notes
            });
            console.log('🚀 Background: Sent notes directly to requesting tab', message.requestingTabId);
        } else {
            // Fallback
            chrome.tabs.query({}, (tabs) => {
                const narrativeeTab = tabs.find(t => t.url?.includes('localhost:') || t.url?.includes('narrativee.com'));
                if (narrativeeTab) {
                    chrome.tabs.sendMessage(narrativeeTab.id, {
                        type: 'NARRATIVEE_NOTES_SYNCED',
                        notes: message.notes
                    });
                    console.log('🚀 Background: Sent notes to Narrativee tab fallback', narrativeeTab.id);
                }
            });
        }

        // Auto-close the Substack scraping tab
        if (sender && sender.tab && sender.tab.id) {
            chrome.tabs.remove(sender.tab.id);
        }
        return true;
    }

    if (message.type === 'INSPIRATION_SAVED') {
        console.log('💡 Background: Received saved inspiration', message.note);
        forwardToNarrativeeTab({
            type: 'NARRATIVEE_INSPIRATION_SAVED',
            note: message.note,
            allNotes: message.allNotes
        });
        return true;
    }

    // ===== ENGAGEMENT AUTOPILOT =====


    if (message.type === 'START_STATS_SYNC') {
        console.log('📊 Background: Received START_STATS_SYNC');

        let dashboardUrl = 'https://substack.com/publish/posts';
        if (message.publicationUrl) {
            dashboardUrl = message.publicationUrl.replace(/\/$/, '') + '/publish/posts';
        }

        chrome.tabs.create({ url: dashboardUrl, active: false }, (tab) => {
            console.log('📊 Background: Opened dashboard tab', tab.id);

            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    console.log('📊 Background: Dashboard loaded, waiting for content script...');

                    // Allow a moment for dynamic content to load
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, { type: 'SCRAPE_STATS' }, async (response) => {
                            if (chrome.runtime.lastError) {
                                console.error('📊 Background: Scrape failed:', chrome.runtime.lastError.message);
                                forwardToNarrativeeTab({ type: 'NARRATIVEE_STATS_SYNC_ERROR', error: chrome.runtime.lastError.message });
                                chrome.tabs.remove(tabId);
                                return;
                            }

                            if (response && response.success) {
                                console.log(`📊 Background: Scraped ${response.count} posts. Syncing to backend...`);

                                try {
                                    // REVISED STRATEGY: Send back to Frontend (Narrativee Tab) to handle API push
                                    forwardToNarrativeeTab({
                                        type: 'NARRATIVEE_STATS_SCRAPED',
                                        posts: response.posts
                                    });

                                } catch (e) {
                                    console.error('📊 Background: Sync error', e);
                                    forwardToNarrativeeTab({ type: 'NARRATIVEE_STATS_SYNC_ERROR', error: e.message });
                                }
                            } else {
                                console.error('📊 Background: Scrape response error', response?.error);
                                forwardToNarrativeeTab({ type: 'NARRATIVEE_STATS_SYNC_ERROR', error: response?.error });
                            }

                            // Close the tab
                            setTimeout(() => chrome.tabs.remove(tabId), 1000);
                        });
                    }, 5000); // 5s wait for dashboard render
                }
            });
        });

        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'START_SUBS_SYNC') {
        console.log('📈 Background: Received START_SUBS_SYNC');

        let overviewUrl = 'https://substack.com/publish/home';
        if (message.publicationUrl) {
            overviewUrl = message.publicationUrl.replace(/\/$/, '') + '/publish/home';
        }

        chrome.tabs.create({ url: overviewUrl, active: false }, (tab) => {
            console.log('📈 Background: Opened overview tab', tab.id);

            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);

                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, { type: 'SCRAPE_SUBS' }, (response) => {
                            if (chrome.runtime.lastError) {
                                forwardToNarrativeeTab({ type: 'NARRATIVEE_SUBS_SCRAPED', error: chrome.runtime.lastError.message, data: [] });
                                chrome.tabs.remove(tabId);
                                return;
                            }
                            forwardToNarrativeeTab({
                                type: 'NARRATIVEE_SUBS_SCRAPED',
                                data: response?.data || [],
                                error: response?.error || null,
                            });
                            setTimeout(() => chrome.tabs.remove(tabId), 1000);
                        });
                    }, 6000);
                }
            });
        });

        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'START_NOTES_PERF_SYNC') {
        console.log('📝 Background: Received START_NOTES_PERF_SYNC for', message.profileUrl);

        // Build notes URL from the profile URL
        let notesUrl = message.profileUrl;
        if (!notesUrl) {
            console.error('📝 Background: No profileUrl provided');
            sendResponse({ success: false, error: 'No profile URL' });
            return true;
        }

        // Persist profileUrl and ensure the 4-hour repeating alarm is set
        chrome.storage.local.set({ narrativee_profile_url: message.profileUrl }, () => {
            chrome.alarms.get('narrativee_notes_perf_cron', (existing) => {
                if (!existing) {
                    chrome.alarms.create('narrativee_notes_perf_cron', { periodInMinutes: 240 });
                    console.log('📝 Background: 4-hour notes perf cron alarm set');
                }
            });
        });
        // Normalize: strip trailing slash, add /notes
        notesUrl = notesUrl.replace(/\/$/, '') + '/notes';

        chrome.tabs.create({ url: notesUrl, active: false }, (tab) => {
            console.log('📝 Background: Opened notes tab', tab.id);

            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    console.log('📝 Background: Notes tab loaded, waiting for scripts...');

                    let attempts = 0;
                    const maxAttempts = 6;

                    function tryScrape() {
                        attempts++;
                        console.log(`📝 Background: Scrape attempt ${attempts}/${maxAttempts}`);

                        chrome.tabs.sendMessage(tabId, { type: 'SCRAPE_OWN_NOTES' }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.warn('📝 Background: Attempt failed:', chrome.runtime.lastError.message);
                                if (attempts < maxAttempts) {
                                    setTimeout(tryScrape, 2000);
                                } else {
                                    forwardToNarrativeeTab({
                                        type: 'NARRATIVEE_NOTES_PERF_SCRAPED',
                                        notes: [],
                                        error: 'Content script not responding'
                                    });
                                    chrome.tabs.remove(tabId);
                                }
                                return;
                            }

                            console.log('📝 Background: Got', response?.notes?.length || 0, 'own notes');
                            forwardToNarrativeeTab({
                                type: 'NARRATIVEE_NOTES_PERF_SCRAPED',
                                notes: response?.notes || []
                            });
                            setTimeout(() => chrome.tabs.remove(tabId), 1000);
                        });
                    }

                    // Allow extra time for the feed to render
                    setTimeout(tryScrape, 4000);
                }
            });
        });

        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'SCRAPE_ENGAGEMENT_FEED') {
        console.log('🎯 Background: Received SCRAPE_ENGAGEMENT_FEED');

        // Open Substack explore/home feed in a new tab
        const feedUrl = 'https://substack.com/home';
        chrome.tabs.create({ url: feedUrl, active: false }, (tab) => {
            console.log('🎯 Background: Opened feed tab', tab.id);

            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    console.log('🎯 Background: Feed tab loaded, waiting for content scripts...');

                    // Retry sending scrape command - content scripts may not be ready yet
                    let attempts = 0;
                    const maxAttempts = 8;

                    function tryScrape() {
                        attempts++;
                        console.log(`🎯 Background: Scrape attempt ${attempts}/${maxAttempts}`);

                        chrome.tabs.sendMessage(tabId, { type: 'SCRAPE_ENGAGEMENT_FEED' }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.warn('🎯 Background: Scrape attempt failed:', chrome.runtime.lastError.message);
                                if (attempts < maxAttempts) {
                                    setTimeout(tryScrape, 3000);
                                } else {
                                    console.error('🎯 Background: All scrape attempts failed');
                                    // Notify Narrativee tab of failure
                                    forwardToNarrativeeTab({
                                        type: 'NARRATIVEE_ENGAGEMENT_FEED_LOADED',
                                        notes: [],
                                        error: 'Content script not responding'
                                    });
                                    chrome.tabs.remove(tabId);
                                }
                                return;
                            }

                            console.log('🎯 Background: Got', response?.notes?.length || 0, 'engagement notes');

                            // Forward to Narrativee tab
                            forwardToNarrativeeTab({
                                type: 'NARRATIVEE_ENGAGEMENT_FEED_LOADED',
                                notes: response?.notes || []
                            });

                            // Close the scrape tab
                            chrome.tabs.remove(tabId);
                        });
                    }

                    // Increased initial delay: Substack home is a heavy React app
                    setTimeout(tryScrape, 6000);
                }
            });
        });
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'POST_ENGAGEMENT_COMMENT') {
        console.log('🎯 Background: Posting comment to', message.noteUrl);

        // Open the note page
        chrome.tabs.create({ url: message.noteUrl, active: false }, (tab) => {
            const commentTabId = tab.id;

            // Listen for completion signal from content script
            function onPostComplete(msg, msgSender) {
                if (msgSender.tab?.id === commentTabId && msg.type === 'ENGAGEMENT_COMMENT_DONE') {
                    chrome.runtime.onMessage.removeListener(onPostComplete);
                    clearTimeout(safetyTimeout);
                    console.log('🎯 Background: Comment posting confirmed, closing tab');

                    // Forward result to Narrativee tab
                    forwardToNarrativeeTab({
                        type: 'NARRATIVEE_COMMENT_POSTED',
                        noteUrl: message.noteUrl,
                        success: msg.success
                    });

                    // Wait a moment then close
                    setTimeout(() => chrome.tabs.remove(commentTabId), 1500);
                }
            }
            chrome.runtime.onMessage.addListener(onPostComplete);

            // Safety timeout — close after 45s no matter what
            const safetyTimeout = setTimeout(() => {
                chrome.runtime.onMessage.removeListener(onPostComplete);
                console.warn('🎯 Background: Comment posting timed out after 45s');
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_COMMENT_POSTED',
                    noteUrl: message.noteUrl,
                    success: false
                });
                chrome.tabs.remove(commentTabId);
            }, 45000);

            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === commentTabId && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);

                    // Retry sending the insert command
                    let attempts = 0;
                    const maxAttempts = 5;

                    function tryInsert() {
                        attempts++;
                        chrome.tabs.sendMessage(commentTabId, {
                            type: 'INSERT_ENGAGEMENT_COMMENT',
                            comment: message.comment,
                            autoPost: message.autoPost || false
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.warn(`🎯 Background: Insert attempt ${attempts} failed:`, chrome.runtime.lastError.message);
                                if (attempts < maxAttempts) {
                                    setTimeout(tryInsert, 2000);
                                } else {
                                    // All attempts failed
                                    chrome.runtime.onMessage.removeListener(onPostComplete);
                                    clearTimeout(safetyTimeout);
                                    forwardToNarrativeeTab({
                                        type: 'NARRATIVEE_COMMENT_POSTED',
                                        noteUrl: message.noteUrl,
                                        success: false
                                    });
                                    chrome.tabs.remove(commentTabId);
                                }
                                return;
                            }
                            console.log('🎯 Background: Comment insert command accepted');
                            // Now we wait for the ENGAGEMENT_COMMENT_DONE message
                        });
                    }

                    setTimeout(tryInsert, 3000);
                }
            });
        });
        sendResponse({ success: true });
        return true;
    }

    // ===== CAMPAIGN ENGAGEMENT =====

    if (message.type === 'GENERATE_CAMPAIGN_REPLY') {
        generateCampaignReply(message.context)
            .then(reply => sendResponse({ success: true, reply }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (message.type === 'SCRAPE_CAMPAIGN_TARGETS') {
        console.log('🎯 Campaign: Opening page to scrape:', message.postUrl);

        chrome.tabs.create({ url: message.postUrl, active: false }, (tab) => {
            const scrapeTabId = tab.id;

            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId !== scrapeTabId || info.status !== 'complete') return;
                chrome.tabs.onUpdated.removeListener(listener);

                // Wait 5s for the page JS to render comments, then send scrape command.
                // The content script handles all waiting/expanding internally.
                setTimeout(() => {
                    chrome.tabs.sendMessage(scrapeTabId, {
                        type: 'SCRAPE_CAMPAIGN_TARGETS',
                        postUrl: message.postUrl,
                    }, (response) => {
                        const error = chrome.runtime.lastError?.message;
                        if (error || !response) {
                            console.error('🎯 Campaign: Scrape failed —', error || 'no response');
                            forwardToNarrativeeTab({
                                type: 'NARRATIVEE_CAMPAIGN_TARGETS_SCRAPED',
                                campaignId: message.campaignId,
                                postUrl: message.postUrl,
                                targets: [],
                                error: error || 'Content script did not respond',
                            });
                        } else {
                            console.log('🎯 Campaign: Got', response.targets?.length || 0, 'targets');
                            forwardToNarrativeeTab({
                                type: 'NARRATIVEE_CAMPAIGN_TARGETS_SCRAPED',
                                campaignId: message.campaignId,
                                postUrl: message.postUrl,
                                targets: response.targets || [],
                                error: response.error || null,
                            });
                        }
                        setTimeout(() => chrome.tabs.remove(scrapeTabId), 1500);
                    });
                }, 5000);
            });
        });
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'POST_CAMPAIGN_REPLY') {
        console.log('🎯 Campaign: Posting reply to', message.targetCommentId, 'on', message.postUrl);

        if (!message.postUrl) {
            forwardToNarrativeeTab({
                type: 'NARRATIVEE_CAMPAIGN_REPLY_DONE',
                campaignId: message.campaignId,
                targetId: message.targetId,
                success: false,
                error: 'No URL available for this target — re-scrape to populate targetCommentUrl'
            });
            return true;
        }

        chrome.tabs.create({ url: message.postUrl, active: true }, (tab) => {
            const replyTabId = tab.id;

            function onReplyDone(msg, msgSender) {
                if (msgSender.tab?.id !== replyTabId) return;
                if (msg.type !== 'CAMPAIGN_REPLY_DONE') return;
                chrome.runtime.onMessage.removeListener(onReplyDone);
                clearTimeout(safetyTimeout);
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_CAMPAIGN_REPLY_DONE',
                    campaignId: message.campaignId,
                    targetId: message.targetId,
                    success: msg.success,
                    replyCommentId: msg.replyCommentId,
                    replyText: message.replyText
                });
                setTimeout(() => chrome.tabs.remove(replyTabId), 1500);
            }
            chrome.runtime.onMessage.addListener(onReplyDone);

            const safetyTimeout = setTimeout(() => {
                chrome.runtime.onMessage.removeListener(onReplyDone);
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_CAMPAIGN_REPLY_DONE',
                    campaignId: message.campaignId,
                    targetId: message.targetId,
                    success: false,
                    error: 'Timeout'
                });
                chrome.tabs.remove(replyTabId);
            }, 60000);

            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId !== replyTabId || info.status !== 'complete') return;
                chrome.tabs.onUpdated.removeListener(listener);

                let attempts = 0;
                function tryReply() {
                    attempts++;
                    chrome.tabs.sendMessage(replyTabId, {
                        type: 'POST_CAMPAIGN_REPLY',
                        targetCommentId: message.targetCommentId,
                        replyText: message.replyText
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            if (attempts < 4) { setTimeout(tryReply, 2000); return; }
                            chrome.runtime.onMessage.removeListener(onReplyDone);
                            clearTimeout(safetyTimeout);
                            forwardToNarrativeeTab({
                                type: 'NARRATIVEE_CAMPAIGN_REPLY_DONE',
                                campaignId: message.campaignId,
                                targetId: message.targetId,
                                success: false,
                                error: 'Content script not responding'
                            });
                            chrome.tabs.remove(replyTabId);
                            return;
                        }
                        // Success/failure comes back via CAMPAIGN_REPLY_DONE message from content script
                        if (response && !response.success) {
                            // Immediate failure from content script
                            chrome.runtime.onMessage.removeListener(onReplyDone);
                            clearTimeout(safetyTimeout);
                            forwardToNarrativeeTab({
                                type: 'NARRATIVEE_CAMPAIGN_REPLY_DONE',
                                campaignId: message.campaignId,
                                targetId: message.targetId,
                                success: false,
                                error: response.error
                            });
                            chrome.tabs.remove(replyTabId);
                        }
                    });
                }
                setTimeout(tryReply, 4000);
            });
        });
        sendResponse({ success: true });
        return true;
    }

    function forwardToNarrativeeTab(message) {
        // Query for Narrativee tabs by URL pattern
        chrome.tabs.query({ url: ['*://localhost/*', '*://*.narrativee.com/*'] }, (tabs) => {
            if (tabs && tabs.length > 0) {
                // Send to all matching tabs (handles multiple windows)
                tabs.forEach(t => {
                    chrome.tabs.sendMessage(t.id, message, () => {
                        if (chrome.runtime.lastError) {
                            // Ignore - tab might not have content script
                        }
                    });
                });
                console.log('🎯 Background: Forwarded to', tabs.length, 'Narrativee tab(s)');
            } else {
                // Fallback: query all tabs and match by URL string
                chrome.tabs.query({}, (allTabs) => {
                    const narrativeeTabs = allTabs.filter(t =>
                        t.url && (t.url.includes('localhost:3010') || t.url.includes('localhost:3000') || t.url.includes('narrativee.com'))
                    );
                    if (narrativeeTabs.length > 0) {
                        narrativeeTabs.forEach(t => {
                            chrome.tabs.sendMessage(t.id, message, () => {
                                if (chrome.runtime.lastError) { /* ignore */ }
                            });
                        });
                        console.log('🎯 Background: Forwarded (fallback) to', narrativeeTabs.length, 'tab(s)');
                    } else {
                        console.warn('🎯 Background: No Narrativee tab found to forward message');
                    }
                });
            }
        });
    }
});

async function generateComment(context) {
    // Get settings
    const settings = await chrome.storage.sync.get(['apiKey', 'tone', 'length']);

    if (!settings.apiKey) {
        throw new Error('Please set your OpenRouter API key in the extension popup');
    }

    const tone = settings.tone || 'thoughtful';
    const targetLength = parseInt(settings.length) || 200;

    const toneInstructions = {
        thoughtful: 'Be reflective and add genuine insight or a personal perspective.',
        friendly: 'Be warm, supportive, and encouraging. Use a conversational tone.',
        professional: 'Be polished and articulate. Share relevant expertise or observations.',
        curious: 'Ask thoughtful follow-up questions that show genuine interest.'
    };

    const lengthInstructions = {
        100: 'Keep it very brief: 1-2 sentences, around 100 characters.',
        200: 'Keep it concise: 2-3 sentences, around 200 characters.',
        350: 'Be moderately detailed: 3-4 sentences, around 350 characters.',
        500: 'Be detailed and thorough: 4-6 sentences, around 500 characters.'
    };

    // Calculate max_tokens based on target length (roughly 4 chars per token)
    const maxTokens = Math.ceil(targetLength / 3);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
            'HTTP-Referer': 'https://substack.com',
            'X-Title': 'Substack Comment Wizard'
        },
        body: JSON.stringify({
            model: 'moonshotai/kimi-k2.5',
            messages: [
                {
                    role: 'system',
                    content: `You are a real person leaving a genuine comment on someone's Substack post. Write like a human, not an AI.

TONE: ${tone}
${toneInstructions[tone]}

LENGTH: ${lengthInstructions[targetLength] || lengthInstructions[200]}

YOUR GOAL:
- Agree with what the OP is saying and show you understand their point
- Ask a genuine follow-up question to learn more or spark discussion
- You are NOT trying to impress anyone or one-up the OP

NEVER DO THIS:
- NEVER claim you've done something similar ("I also did this", "I made X", "I sold Y")
- NEVER brag about your own achievements or results
- NEVER make up fake personal stories or accomplishments
- NEVER say "me too" type responses with made-up details

DO THIS INSTEAD:
- React to what they said ("This is such a good point", "Hadn't thought of it that way")
- Expand on their idea or add a related thought
- Ask a genuine question ("What format do you think works best?", "Do you think X or Y?")
- Express curiosity about their experience

HOW TO SOUND HUMAN:
- Write casually, like you're texting a friend
- Use contractions (I'm, don't, can't, it's, that's)
- Start with "So", "Honestly", "This", "Wait" sometimes
- Include filler words naturally (like, kinda, actually)

WHAT NOT TO DO (these scream AI):
- Don't use: "resonate", "profound", "delve", "unpack", "navigate", "landscape", "journey"
- Don't be overly complimentary
- Avoid perfect grammar and semicolons

Return ONLY the comment text, nothing else.`
                },
                {
                    role: 'user',
                    content: `Write a comment for this Substack post:

TITLE: ${context.title}

AUTHOR: ${context.author}

ARTICLE EXCERPT:
${context.content}

Write a single engaging comment (~${targetLength} characters):`
                }
            ],
            max_tokens: maxTokens,
            temperature: 0.8
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate comment');
    }

    const data = await response.json();
    const comment = data.choices[0]?.message?.content?.trim();

    if (!comment) {
        throw new Error('No comment generated');
    }

    return comment;
}

// Generate an original note using the user's profile
async function generateNote(topic) {
    const settings = await chrome.storage.sync.get([
        'apiKey', 'bio', 'goals', 'topics', 'style', 'articles'
    ]);

    if (!settings.apiKey) {
        throw new Error('Please set your OpenRouter API key in the extension popup');
    }

    const styleDescriptions = {
        casual: 'Write casually and conversationally, like chatting with a friend. Use contractions, informal language.',
        provocative: 'Be bold and provocative. Challenge assumptions, make strong statements, be contrarian when appropriate.',
        educational: 'Be helpful and educational. Share insights, explain concepts clearly, provide actionable takeaways.',
        witty: 'Be clever and witty. Use wordplay, humor, and sharp observations.',
        inspirational: 'Be motivating and inspirational. Uplift the reader, share encouragement, paint a vision.'
    };

    const profileContext = `
ABOUT THE WRITER:
${settings.bio || 'A Substack writer'}

THEIR GOALS:
${settings.goals || 'Growing their audience and sharing valuable content'}

TOPICS THEY COVER:
${settings.topics || 'Various topics'}

WRITING STYLE:
${styleDescriptions[settings.style] || styleDescriptions.casual}

${settings.articles ? `SAMPLE OF THEIR WRITING (match this voice):
${settings.articles.substring(0, 1500)}` : ''}
`.trim();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
            'HTTP-Referer': 'https://substack.com',
            'X-Title': 'Substack Note Generator'
        },
        body: JSON.stringify({
            model: 'moonshotai/kimi-k2.5',
            messages: [
                {
                    role: 'system',
                    content: `You are a Substack writer creating an original note. Write as if YOU are the writer - authentic, personal, human.

${profileContext}

HOW TO SOUND HUMAN:
- Write like you're texting a smart friend, not publishing an article
- Use contractions (I'm, don't, can't, it's, that's, we're)
- Start some sentences with "And", "But", "So", "Like", "Honestly", "Look", "Here's the thing"
- Use casual phrases: "kinda", "pretty much", "actually", "honestly", "low-key"
- Imperfect punctuation is fine - use ... trails, dashes, even skip some commas
- React emotionally sometimes ("This blew my mind", "I was wrong about this")
- Make it feel like a moment of clarity or insight you're sharing

FORMATTING FOR SUBSTACK NOTES:
- Keep paragraphs SHORT - 1-2 sentences each
- Use line breaks between thoughts for readability
- Put your hook/punch line at the START, not the end
- Total length: 3-6 short paragraphs
- End with something that invites engagement OR just trail off naturally

BANNED (these scream AI):
- "resonate", "profound", "delve", "unpack", "navigate", "landscape", "journey", "game-changer"
- Perfect grammar throughout
- Overly structured or listy formats
- Hashtags
- Emojis (unless the writer's style uses them)
- Promotional language or CTAs unless natural

Return ONLY the note text. No quotes, no explanations, no meta-commentary.`
                },
                {
                    role: 'user',
                    content: `Write a Substack note about: ${topic}

Remember: Short paragraphs, punchy start, human voice.`
                }
            ],
            max_tokens: 600,
            temperature: 0.9
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate note');
    }

    const data = await response.json();
    const note = data.choices[0]?.message?.content?.trim();

    if (!note) {
        throw new Error('No note generated');
    }

    return note;
}

// ==========================================
// ARTICLE WRITING ASSISTANT FUNCTIONS
// ==========================================

async function getProfileAndApiKey() {
    const settings = await chrome.storage.sync.get([
        'apiKey', 'bio', 'goals', 'topics', 'style', 'articles'
    ]);

    if (!settings.apiKey) {
        throw new Error('Please set your OpenRouter API key in the extension popup');
    }

    return settings;
}

async function callOpenRouter(messages, maxTokens = 1000) {
    const settings = await getProfileAndApiKey();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
            'HTTP-Referer': 'https://substack.com',
            'X-Title': 'Substack Writing Assistant'
        },
        body: JSON.stringify({
            model: 'moonshotai/kimi-k2.5',
            messages,
            max_tokens: maxTokens,
            temperature: 0.8
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
}

// Write a section of article content
async function writeArticleSection(prompt, context = {}) {
    const settings = await getProfileAndApiKey();

    const profileContext = settings.bio ? `
WRITER'S BACKGROUND: ${settings.bio}
TOPICS: ${settings.topics || 'Various'}
STYLE: ${settings.style || 'casual'}
` : '';

    const messages = [
        {
            role: 'system',
            content: `You are a skilled writer helping create a Substack article. Write in a natural, engaging style.

${profileContext}

WRITING STYLE:
- Write like a human, not AI. Conversational, relatable, authentic.
- Use short paragraphs (2-3 sentences max)
- Start with a hook that grabs attention
- Use contractions (I'm, don't, can't)
- Include personal observations, examples, or stories when relevant
- Avoid clichés: "In today's world...", "It's important to note..."
- BANNED words: resonate, delve, unpack, navigate, landscape, journey, game-changer

FORMAT:
- Write in clean HTML paragraphs: <p>...</p>
- For headings use: <h2>...</h2>
- For emphasis: <strong>...</strong> or <em>...</em>
- For lists: <ul><li>...</li></ul>

${context.title ? `ARTICLE TITLE: ${context.title}` : ''}
${context.existingContent ? `EXISTING CONTENT (continue from here):\n${context.existingContent.substring(0, 500)}...` : ''}

Return ONLY the HTML content, no explanations or markdown.`
        },
        {
            role: 'user',
            content: `Write about: ${prompt}`
        }
    ];

    return await callOpenRouter(messages, 1500);
}

// Expand selected text
async function expandText(text, context = {}) {
    const messages = [
        {
            role: 'system',
            content: `You are helping expand a piece of text into a more detailed, richer version.

RULES:
- Keep the same voice and tone as the original
- Add more detail, examples, or explanations
- Make it 2-3x longer
- Keep it engaging and readable
- Use short paragraphs
- Output in HTML format: <p>...</p>

Return ONLY the expanded HTML content.`
        },
        {
            role: 'user',
            content: `Expand this text:\n\n"${text}"`
        }
    ];

    return await callOpenRouter(messages, 1000);
}

// Rewrite text differently
async function rewriteText(text, context = {}) {
    const messages = [
        {
            role: 'system',
            content: `You are helping rewrite a piece of text to be clearer and more engaging.

RULES:
- Keep the same core meaning
- Make it more punchy and readable
- Improve flow and clarity
- Use active voice
- Keep similar length
- Output in HTML format: <p>...</p>

Return ONLY the rewritten HTML content, no explanations.`
        },
        {
            role: 'user',
            content: `Rewrite this:\n\n"${text}"`
        }
    ];

    return await callOpenRouter(messages, 800);
}

// Suggest headlines
async function suggestHeadlines(content) {
    const messages = [
        {
            role: 'system',
            content: `You are helping create compelling headlines for a Substack article.

RULES:
- Generate 5 different headline options
- Mix styles: curiosity, benefit-driven, controversial, how-to
- Keep them under 60 characters when possible
- Make them click-worthy but not clickbait
- Number each option 1-5

Return ONLY the 5 numbered headlines, one per line.`
        },
        {
            role: 'user',
            content: `Suggest headlines for this article:\n\n${content.substring(0, 1000)}`
        }
    ];

    return await callOpenRouter(messages, 300);
}

// Generate article outline
async function generateOutline(topic) {
    const settings = await getProfileAndApiKey();

    const messages = [
        {
            role: 'system',
            content: `You are helping create an article outline for a Substack post.

${settings.bio ? `WRITER: ${settings.bio}` : ''}
${settings.topics ? `TYPICAL TOPICS: ${settings.topics}` : ''}

Create a structured outline with:
- A compelling hook/intro concept
- 3-5 main sections with subpoints
- A strong conclusion/CTA idea

Format as a numbered outline. Keep it practical and actionable.`
        },
        {
            role: 'user',
            content: `Create an outline for an article about: ${topic}`
        }
    ];

    return await callOpenRouter(messages, 600);
}

// Generate a personalized campaign reply — calls the Narrativee backend (uses Grok API key server-side)
async function generateCampaignReply(context) {
    // Pull profile data from extension storage to send to backend
    const settings = await chrome.storage.sync.get(['bio', 'goals', 'topics', 'style', 'articles']);

    const response = await fetch(`${NARRATIVEE_API_URL}/campaigns/generate-reply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            context: {
                ...context,
                bio: settings.bio || '',
                goals: settings.goals || '',
                topics: settings.topics || '',
                style: settings.style || 'casual',
                articles: settings.articles || '',
            },
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate reply');
    }

    const data = await response.json();
    if (!data.reply) throw new Error('No reply generated');
    return data.reply;
}
