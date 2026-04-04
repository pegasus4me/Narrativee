// Background service worker - handles API calls to OpenRouter / Narrativee backend

const NARRATIVEE_API_URL = 'http://localhost:3002/api';

// ==========================================
// HEADLESS SUBSTACK UTILITIES
// ==========================================

async function headlessSubstackPost(content) {
    try {
        console.log('🚀 Headless Post: Formatting payload...');
        const paragraphs = content.split('\n').filter(p => p.trim() !== '');
        
        let bodyContent = paragraphs.map(p => ({
            type: "paragraph",
            content: [{ type: "text", text: p }]
        }));

        const payload = {
            bodyJson: {
                type: "doc",
                attrs: { schemaVersion: "v1" },
                content: bodyContent
            },
            replyMinimumRole: "everyone"
        };
        
        console.log('🚀 Headless Post: Sending API request to Substack...');
        const init = {
            method: 'POST',
            headers: {
                'accept': '*/*',
                'content-type': 'application/json',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            },
            body: JSON.stringify(payload)
        };
        
        const response = await fetch('https://substack.com/api/v1/comment/feed', init);
        
        if (!response.ok) {
            throw new Error(`Substack API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('🚀 Headless Post: Success!', data);
        return { success: true, data };
    } catch (e) {
        console.error('🚀 Headless Post Error:', e);
        return { success: false, error: e.message };
    }
}

// ==========================================
// TARGET REPLY HEADLESS UTILITY
// ==========================================

async function headlessCampaignReply(targetCommentId, content) {
    try {
        console.log(`🎯 Headless Reply: Sending API request to reply to ${targetCommentId}...`);
        
        // Parse paragraphs to match Substack's ProseMirror JSON structure
        const paragraphs = content.split('\n').filter(p => p.trim() !== '');
        const bodyContent = paragraphs.map(p => ({
            type: "paragraph",
            content: [{ type: "text", text: p }]
        }));

        const payload = {
            bodyJson: {
                type: "doc",
                attrs: { schemaVersion: "v1" },
                content: bodyContent
            },
            parent_id: parseInt(targetCommentId, 10),
            replyMinimumRole: "everyone"
        };
        
        const init = {
            method: 'POST',
            headers: {
                'accept': '*/*',
                'content-type': 'application/json',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            },
            body: JSON.stringify(payload)
        };
        
        const response = await fetch('https://substack.com/api/v1/comment/feed', init);
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API error: ${response.status} - ${errText.slice(0, 50)}`);
        }
        
        const data = await response.json();
        console.log('🎯 Headless Reply: Success!', data);
        return { success: true, data };
    } catch (e) {
        console.error('🎯 Headless Reply Error:', e);
        return { success: false, error: e.message };
    }
}

async function headlessFeedPull() {
    try {
        console.log('🚀 Headless Feed: Calling Substack Feed API...');
        const init = {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            }
        };
        
        let allItems = [];
        let currentCursor = null;
        const maxPages = 4; // Fetch up to ~60 items
        
        for (let page = 0; page < maxPages; page++) {
            let url = 'https://substack.com/api/v1/reader/feed?tab=for-you&type=base';
            if (currentCursor) {
                url += `&cursor=${encodeURIComponent(currentCursor)}`;
            }
            
            const response = await fetch(url, init);
            if (!response.ok) {
                console.warn(`Substack API error on page ${page + 1}: ${response.status}`);
                break;
            }
            
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                allItems.push(...data.items);
            }
            
            if (data.nextCursor) {
                currentCursor = data.nextCursor;
            } else {
                break; // No more pages
            }
        }
        
        const notes = [];
        const seenIds = new Set();
        
        for (const item of allItems) {
            // We only want Notes (which Substack maps to "comment" internally)
            if (item.type !== 'comment') continue;
            
            const obj = item.comment;
            if (!obj) continue;
            // Skip restacks
            if (obj.restacked) continue;
            
            const id = obj.id;
            if (!id || seenIds.has(id)) continue;
            seenIds.add(id);
            
            const content = obj.body || obj.description || '';
            if (content.length < 20) continue;
            
            const tracking = item.trackingParameters || {};
            
            const likes = obj.reaction_count || obj.likes || tracking.item_current_reaction_count || tracking.score_like || 0;
            const comments = obj.children_count || obj.reply_count || obj.comment_count || obj.commentCount || tracking.item_current_reply_count || 0;
            const restacks = obj.restacks || obj.restack_count || tracking.item_current_restack_count || 0;
            
            const handle = obj.handle || obj.publishedBylines?.[0]?.handle || '';
            let noteUrl = obj.canonical_url || '';
            
            // Construct the canonical note url if missing
            if (!noteUrl && handle && id && item.type === 'comment') {
                noteUrl = `https://substack.com/@${handle}/note/c-${id}`;
            } else if (!noteUrl && handle && id && item.type === 'post') {
                noteUrl = `https://substack.com/@${handle}/p-${id}`;
            }
            
            if (!noteUrl) continue;
            
            notes.push({
                id: 'feed_' + id,
                content: content.slice(0, 800),
                author: {
                    name: obj.name || obj.publishedBylines?.[0]?.name || obj.author?.name || 'Unknown',
                    handle: handle || obj.author?.handle || '',
                    avatar: obj.photo_url || obj.publishedBylines?.[0]?.photo_url || obj.author?.photo_url || '',
                },
                engagement: { likes, restacks, comments },
                totalEngagement: likes + restacks + comments,
                url: noteUrl,
                timestamp: obj.date || obj.post_date || new Date().toISOString(),
                scrapedAt: new Date().toISOString()
            });
        }
        
        console.log('🚀 Headless Feed: Successfully parsed', notes.length, 'notes');
        return { success: true, notes };
    } catch (e) {
        console.error('🚀 Headless Feed Error:', e);
        return { success: false, error: e.message };
    }
}

// ==========================================
// TARGET SCRAPER HEADLESS UTILITY
// ==========================================

async function headlessScrapeTargets(campaignId, postUrl) {
    try {
        console.log('🎯 Headless Target Scraper: Fetching targets for', postUrl);
        
        // Explicitly block legacy posts/articles
        if (postUrl.includes('/p/')) {
            throw new Error('This appears to be an Article. Narrativee target extraction is now strictly optimized for Substack Notes only. Please pull a fresh feed or search for Notes!');
        }

        const match = postUrl.match(/\/c-(\d+)/) || postUrl.match(/\/p-(\d+)/);
        if (!match) {
            throw new Error('Could not extract Note ID from URL.');
        }
        const noteId = match[1];
        const isPost = postUrl.includes('/p-');

        const init = {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            }
        };

        // Fetch up to 3 pages of comments
        let allComments = [];
        let currentCursor = null;
        let currentOffset = 0;
        const maxPages = 3;

        for (let page = 0; page < maxPages; page++) {
            let url;
            if (isPost) {
                url = `https://substack.com/api/v1/post/${noteId}/comments?sortBy=top&offset=${currentOffset}`;
            } else {
                url = `https://substack.com/api/v1/reader/comment/${noteId}/replies?comment_id=${noteId}`;
                if (currentCursor) url += `&cursor=${encodeURIComponent(currentCursor)}`;
            }

            const response = await fetch(url, init);
            if (!response.ok) break;

            const data = await response.json();
            
            if (data.commentBranches && data.commentBranches.length > 0) {
                // Notes use commentBranches
                allComments.push(...data.commentBranches);
            } else if (data.comments && data.comments.length > 0) {
                // Posts use comments
                allComments.push(...data.comments);
            } else if (data.items && data.items.length > 0) {
                allComments.push(...data.items);
            }
            
            if (isPost) {
                if (!data.comments || data.comments.length === 0) break;
                currentOffset += data.comments.length;
            } else {
                if (data.nextCursor) {
                    currentCursor = data.nextCursor;
                } else {
                    break;
                }
            }
        }

        const targets = [];
        const seen = new Set();
        
        // Recursive function to parse comments and their child threads
        function processCommentThread(commentObj, parentCommentId, parentCommentUrl, parentCommentContent) {
            if (!commentObj || targets.length >= 50) return;
            
            const data = commentObj.comment || commentObj;
            const commentId = data.id;
            if (!commentId) return;

            const authorName = data.name || data.child_name || '';
            const authorHandle = data.handle || '';
            const commentText = data.body || '';
            const targetUrl = `https://substack.com/note/c-${commentId}`;

            if ((authorName || authorHandle) && !seen.has(commentId)) {
                seen.add(commentId);
                targets.push({
                    parentCommentId: parentCommentId || noteId,
                    parentCommentUrl: parentCommentUrl || postUrl,
                    parentPostUrl: postUrl,
                    parentCommentContent: parentCommentContent || 'Top level note',
                    targetAuthorName: authorName,
                    targetAuthorHandle: authorHandle,
                    targetCommentId: commentId.toString(),
                    targetCommentUrl: targetUrl,
                    targetCommentContent: commentText,
                    originalNoteContent: 'Top level note',
                });
            }

            // Substack might place children in descendantComments, children, or replies
            const children = commentObj.descendantComments || data.descendantComments || data.children || data.replies || [];
            for (const child of children) {
                if (targets.length >= 50) break;
                processCommentThread(child, commentId.toString(), targetUrl, commentText);
            }
        }

        for (const rootComment of allComments) {
            if (targets.length >= 50) break;
            processCommentThread(rootComment, noteId, postUrl, 'Top level note');
        }

        console.log('🎯 Headless Target Scraper: Successfully parsed', targets.length, 'targets');
        return { success: true, targets };
    } catch (e) {
        console.error('🎯 Headless Target Scraper Error:', e);
        return { success: false, error: e.message };
    }
}

// ==========================================
// SEARCH HEADLESS UTILITY
// ==========================================

async function headlessSearchNotes(keyword) {
    try {
        console.log('🔍 Headless Search: Calling Substack Search API for:', keyword);
        const init = {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            }
        };
        
        let allItems = [];
        let currentCursor = null;
        const maxPages = 4; // Fetch up to ~60-80 items
        
        for (let page = 0; page < maxPages; page++) {
            let url = `https://substack.com/api/v1/top/search?query=${encodeURIComponent(keyword)}&fromSuggestedSearch=true`;
            if (currentCursor) {
                url += `&cursor=${encodeURIComponent(currentCursor)}`;
            }
            
            const response = await fetch(url, init);
            if (!response.ok) {
                console.warn(`Substack API search error on page ${page + 1}: ${response.status}`);
                break;
            }
            
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                allItems.push(...data.items);
            }
            
            if (data.nextCursor) {
                currentCursor = data.nextCursor;
            } else {
                break; // No more pages
            }
        }
        
        const notes = [];
        const seenIds = new Set();
        
        for (const item of allItems) {
            // We only want Notes (which Substack maps to "comment" internally)
            if (item.type !== 'comment') continue;
            
            const obj = item.comment;
            if (!obj) continue;
            
            // Skip restacks
            if (obj.restacked) continue;
            
            const id = obj.id;
            if (!id || seenIds.has(id)) continue;
            seenIds.add(id);
            
            const content = obj.body || obj.description || '';
            if (content.length < 20) continue;
            
            const tracking = item.trackingParameters || {};
            
            const likes = obj.reaction_count || obj.likes || tracking.item_current_reaction_count || tracking.score_like || 0;
            const comments = obj.children_count || obj.reply_count || obj.comment_count || obj.commentCount || tracking.item_current_reply_count || 0;
            const restacks = obj.restacks || obj.restack_count || tracking.item_current_restack_count || 0;
            
            const handle = obj.handle || obj.publishedBylines?.[0]?.handle || '';
            let noteUrl = obj.canonical_url || '';
            
            if (!noteUrl && handle && id && item.type === 'comment') {
                noteUrl = `https://substack.com/@${handle}/note/c-${id}`;
            } else if (!noteUrl && handle && id && item.type === 'post') {
                noteUrl = `https://substack.com/@${handle}/p-${id}`;
            }
            
            if (!noteUrl) continue;
            
            notes.push({
                id: 'search_' + id,
                content: content.slice(0, 800),
                author: {
                    name: obj.name || obj.publishedBylines?.[0]?.name || obj.author?.name || 'Unknown',
                    handle: handle || obj.author?.handle || '',
                    avatar: obj.photo_url || obj.publishedBylines?.[0]?.photo_url || obj.author?.photo_url || '',
                },
                engagement: { likes, restacks, comments },
                totalEngagement: likes + restacks + comments,
                url: noteUrl,
                timestamp: obj.date || obj.post_date || new Date().toISOString(),
                scrapedAt: new Date().toISOString()
            });
        }
        
        console.log('🔍 Headless Search: Successfully parsed', notes.length, 'notes');
        return { success: true, notes };
    } catch (e) {
        console.error('🔍 Headless Search Error:', e);
        return { success: false, error: e.message };
    }
}

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

    headlessSubstackPost(content).then(result => {
        stopKeepAlive();
        if (result.success) {
            console.log('⏰ Scheduled post confirmed posted!');
            forwardScheduledPostResult(postId, 'published');
        } else {
            console.warn('⏰ Scheduled post failed', result.error);
            forwardScheduledPostResult(postId, false);
        }
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
        console.log('🚀 Background: Received OPEN_SUBSTACK_DRAFT (Headless mode)', message.draft);
        headlessSubstackPost(message.draft.content)
            .then(result => {
                if (result.success) {
                    console.log('🚀 Background: Headless post successful!');
                } else {
                    console.error('🚀 Background: Headless post failed', result.error);
                }
                sendResponse(result);
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
        
        headlessFeedPull().then(result => {
            if (result.success) {
                console.log('🎯 Background: Headless feed pull successful!');
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_ENGAGEMENT_FEED_LOADED',
                    notes: result.notes || []
                });
            } else {
                console.error('🎯 Background: Headless feed pull failed', result.error);
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_ENGAGEMENT_FEED_LOADED',
                    notes: [],
                    error: result.error
                });
            }
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
        console.log('🎯 Campaign: Initializing headless target scraper for:', message.postUrl);
        
        headlessScrapeTargets(message.campaignId, message.postUrl).then(result => {
            if (result.success) {
                console.log('🎯 Campaign: Headless target scrape successful!', result.targets?.length);
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_CAMPAIGN_TARGETS_SCRAPED',
                    campaignId: message.campaignId,
                    postUrl: message.postUrl,
                    targets: result.targets || [],
                    error: null,
                });
            } else {
                console.error('🎯 Campaign: Headless target scrape failed', result.error);
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_CAMPAIGN_TARGETS_SCRAPED',
                    campaignId: message.campaignId,
                    postUrl: message.postUrl,
                    targets: [],
                    error: result.error,
                });
            }
        });
        
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'SEARCH_KEYWORD_NOTES') {
        console.log('🔍 Keyword Search: Initializing headless search for keyword:', message.keyword);
        
        headlessSearchNotes(message.keyword).then(result => {
            if (result.success) {
                console.log('🔍 Keyword Search: Headless search successful!');
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_KEYWORD_SEARCH_RESULTS',
                    keyword: message.keyword,
                    notes: result.notes || []
                });
            } else {
                console.error('🔍 Keyword Search: Headless search failed', result.error);
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_KEYWORD_SEARCH_RESULTS',
                    keyword: message.keyword,
                    notes: [],
                    error: result.error
                });
            }
        });
        
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'POST_CAMPAIGN_REPLY') {
        console.log('🎯 Campaign: Initializing headless reply to', message.targetCommentId);

        headlessCampaignReply(message.targetCommentId, message.replyText).then(result => {
            if (result.success) {
                console.log('🎯 Campaign: Headless reply successful!');
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_CAMPAIGN_REPLY_DONE',
                    campaignId: message.campaignId,
                    targetId: message.targetId,
                    success: true,
                    replyCommentId: result.data?.id || null // Usually returns the new comment id
                });
            } else {
                console.error('🎯 Campaign: Headless reply failed', result.error);
                forwardToNarrativeeTab({
                    type: 'NARRATIVEE_CAMPAIGN_REPLY_DONE',
                    campaignId: message.campaignId,
                    targetId: message.targetId,
                    success: false,
                    error: result.error
                });
            }
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
