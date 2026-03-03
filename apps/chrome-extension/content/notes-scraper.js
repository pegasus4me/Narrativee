
// ==========================================
// OWN NOTES PERFORMANCE SCRAPER
// Scrapes the user's own Substack Notes feed for performance metrics
// ==========================================

(function initNotesPerformanceScraper() {
    console.log('📝 [Narrativee] Notes performance scraper loaded');

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SCRAPE_OWN_NOTES') {
            console.log('📝 Received SCRAPE_OWN_NOTES command');
            scrapeOwnNotes()
                .then(notes => {
                    console.log(`📝 Scraped ${notes.length} own notes`);
                    sendResponse({ success: true, count: notes.length, notes });
                })
                .catch(err => {
                    console.error('📝 Scrape error:', err);
                    sendResponse({ success: false, error: err.message });
                });
            return true; // async response
        }
    });

    async function scrapeOwnNotes() {
        // Wait a moment for the page to settle
        await new Promise(resolve => setTimeout(resolve, 2000));

        const notes = [];
        const seen = new Set();

        // Extract the target handle from the current URL
        // Example: https://username.substack.com/notes -> handle: 'username'
        // Example: https://substack.com/@username/notes -> handle: 'username'
        let targetHandle = '';
        const hostMatch = window.location.hostname.match(/^([a-zA-Z0-9-]+)\.substack\.com/);
        const pathMatch = window.location.pathname.match(/^\/@([a-zA-Z0-9-]+)/);

        if (hostMatch && hostMatch[1] !== 'www') {
            targetHandle = hostMatch[1].toLowerCase();
        } else if (pathMatch) {
            targetHandle = pathMatch[1].toLowerCase();
        }

        // Scroll down multiple times to trigger Substack's infinite-load
        console.log('📝 Scrolling to load all notes...');
        for (let i = 0; i < 8; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        // Scroll back to top
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Substack Notes feed items
        const feedItems = document.querySelectorAll(
            '.feedUnit-NTpfyQ, [class*="feedUnit"], .feed-item, [class*="feed-item"]'
        );

        console.log(`📝 Found ${feedItems.length} feed items after scroll`);

        for (const item of Array.from(feedItems)) {
            try {
                // ── Identify author from the note's own permalink URL ────────────
                // Substack note URLs always look like: /@authorhandle/note/c-XXXXXX
                // This is the most reliable signal — it's the note's canonical URL.
                const notePermalink = item.querySelector('a[href*="/note/"]');
                let noteUrl = notePermalink?.getAttribute('href') || '';

                let itemHandle = '';
                if (noteUrl) {
                    // href = "/@businessmentalist/note/c-221782014"
                    const m = noteUrl.match(/^\/@([a-zA-Z0-9_-]+)\/note\//);
                    if (m) itemHandle = m[1].toLowerCase();
                }

                console.log(`📝 note url: '${noteUrl}' → handle: '${itemHandle}' | target: '${targetHandle}'`);

                // Strict match — skip anything not by the target user
                if (targetHandle && itemHandle !== targetHandle) {
                    console.log(`📝 skip: '${itemHandle}' ≠ '${targetHandle}'`);
                    continue;
                }

                // If we can't determine the handle at all, skip to be safe
                if (targetHandle && !itemHandle) {
                    console.log('📝 skip: no handle found in note URL');
                    continue;
                }


                // ── Content preview ──────────────────────────────────────
                const proseMirror = item.querySelector(
                    '.ProseMirror, [class*="ProseMirror"], [class*="feedCommentBody"] p, .feedCommentBody p'
                );
                const content = proseMirror?.innerText?.trim() || proseMirror?.textContent?.trim() || '';
                if (!content) continue;

                const contentPreview = content.substring(0, 280);

                // ── URL ───────────────────────────────────────────────────
                const linkEl = item.querySelector('a[href*="/p/"], a[href*="/note/"]');
                const url = linkEl?.href || '';

                // deduplicate
                const dedupeKey = url || contentPreview.substring(0, 60);
                if (seen.has(dedupeKey)) continue;
                seen.add(dedupeKey);

                // substackNoteId from URL
                let substackNoteId = '';
                if (url) {
                    const m = url.match(/\/p\/([^/?#]+)|\/note\/([^/?#]+)/);
                    substackNoteId = m?.[1] || m?.[2] || '';
                }

                // ── Date ─────────────────────────────────────────────────
                // Substack uses a title attr on the note permalink: title="Mar 2, 2026, 10:28 AM"
                // Fall back to time[datetime] if present
                const noteLink = item.querySelector('a[href*="/note/"]');
                const titleDate = noteLink?.getAttribute('title') || null;
                const timeEl = item.querySelector('time[datetime], [datetime]');
                const publishedAt = timeEl?.getAttribute('datetime') ||
                    (titleDate ? new Date(titleDate).toISOString() : null);

                // ── Metrics ───────────────────────────────────────────────
                // ── Metrics ───────────────────────────────────────────────
                let likes = 0, comments = 0, restacks = 0;

                const parseMetric = (text) => {
                    if (!text) return 0;
                    const v = text.toLowerCase().trim();
                    if (v.endsWith('k')) return Math.round(parseFloat(v) * 1000);
                    if (v.endsWith('m')) return Math.round(parseFloat(v) * 1000000);
                    return parseInt(v, 10) || 0;
                };

                // Find the main interaction row (usually at the bottom of the feed unit)
                const actionRow = item.querySelector('.feedUnit-NTpfyQ-actions, [class*="actionRow"], [class*="feedItemActions"]');
                const searchRoot = actionRow || item;

                // Typical Substack structure for an engagement button:
                // <div/button aria-label="Like...">
                //    <div class="label...">12</div>
                // </div/button>

                const likeBtn = searchRoot.querySelector('[aria-label*="like" i], [aria-label*="heart" i], [class*="likeButton"]');
                const commentBtn = searchRoot.querySelector('[aria-label*="comment" i], [aria-label*="reply" i], [class*="commentButton"]');
                const restackBtn = searchRoot.querySelector('[aria-label*="restack" i], [aria-label*="share" i], [class*="restackButton"]');

                if (likeBtn) likes = parseMetric(likeBtn.textContent);
                if (commentBtn) comments = parseMetric(commentBtn.textContent);
                if (restackBtn) restacks = parseMetric(restackBtn.textContent);

                notes.push({
                    substackNoteId,
                    contentPreview,
                    url,
                    publishedAt,
                    likes,
                    comments,
                    restacks,
                });

            } catch (e) {
                console.warn('📝 Skipped a note item:', e);
            }
        }

        console.log(`📝 Extracted ${notes.length} own notes`);
        return notes;
    }

})();
