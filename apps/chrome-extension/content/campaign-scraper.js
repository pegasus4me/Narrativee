// ==========================================
// CAMPAIGN 2ND-DEGREE COMMENT SCRAPER
// ==========================================

(function initCampaignScraper() {
    console.log('🎯 [Narrativee] Campaign scraper loaded');

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === 'SCRAPE_CAMPAIGN_TARGETS') {
            scrapeCampaignTargets(message.postUrl)
                .then(targets => sendResponse({ success: true, targets }))
                .catch(err => sendResponse({ success: false, error: err.message, targets: [] }));
            return true;
        }

        if (message.type === 'POST_CAMPAIGN_REPLY') {
            postCampaignReply(message.replyText)
                .then(result => sendResponse(result))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SCRAPING
    // ─────────────────────────────────────────────────────────────────────────

    async function scrapeCampaignTargets(postUrl) {
        const isNotePage = /\/note\/c-/.test(postUrl);
        console.log('🎯 Page type:', isNotePage ? 'note permalink' : 'blog post');
        return isNotePage ? scrapeNotePage(postUrl) : scrapeBlogPage(postUrl);
    }

    // ── Note permalink page (/profile/xxx/note/c-ID) ─────────────────────────
    // Structure: flat list of feedUnit elements.
    // Top-level comments have no "hasContext-" class.
    // Replies (2nd-degree) have "hasContext-" in their class.

    async function scrapeNotePage(postUrl) {
        // 1. Wait for the comment feed to appear (up to 15s)
        const feedReady = await poll(
            () => document.querySelectorAll('[class*="feedUnit-"], .comment-list-item, [data-comment-id]').length > 0,
            15000, 500
        );
        if (!feedReady) return [];

        // Check if this note page actually uses the blog comment structure
        if (document.querySelectorAll('.comment-list-item').length > 0) {
            console.log('🎯 Note page uses unified blog comment DOM. Falling back to blog scraper.');
            return scrapeBlogPage(postUrl);
        }

        // 2. Expand replies: click "Show more replies" until we have 30 replies or no button left
        await expandReplies(30);

        // 3. Extract original note text (the permalink comment at the top)
        const permalinkEl = document.querySelector('[class*="feedPermalinkUnit"]');
        const originalNoteContent = getCommentText(permalinkEl);

        // 4. Collect all feedUnit elements that are NOT part of the permalink header
        const allUnits = Array.from(document.querySelectorAll('[class*="feedUnit-"]'))
            .filter(el => !el.closest('[class*="feedPermalinkUnit"]'));

        let units = allUnits;
        const mainContainer = permalinkEl?.parentElement;

        if (mainContainer) {
            // Strict filter: only elements inside the same wrapper container as the permalink note.
            // This cleanly isolates the comment thread from footer "Related notes" or sidebar items.
            const strictUnits = allUnits.filter(el => mainContainer.contains(el));
            if (strictUnits.length > 0) {
                units = strictUnits;
            } else if (mainContainer.parentElement) {
                // Loosen constraint by 1 level if comments are siblings to the permalink's container
                units = allUnits.filter(el => mainContainer.parentElement.contains(el));
            }
        }

        // Final safeguard: Comments rarely have aria-label="Note", while "Related Notes" do.
        units = units.filter(el => {
            const isStandaloneNote = el.getAttribute('aria-label') === 'Note' || el.querySelector('[aria-label="Note"]');
            return !isStandaloneNote;
        });

        console.log('🎯 feedUnit count (comments only):', units.length);

        // 5. Group into threads: parent → replies[]
        // A unit with "hasContext-" in its class is a reply to the preceding parent.
        const threads = [];
        let current = null;
        for (const unit of units) {
            if (unit.className.includes('hasContext-')) {
                if (current) current.replies.push(unit);
            } else {
                current = { parent: unit, replies: [] };
                threads.push(current);
            }
        }

        console.log('🎯 Threads found:', threads.length);

        // 6. Build target list from reply units
        const targets = [];
        const mainNoteId = postUrl.match(/\/note\/c-(\d+)/)?.[1] || '';

        for (const { parent, replies } of threads) {
            // Target the direct reply to the note
            const directId = getCommentId(parent);
            if (directId) {
                const authorName = getAuthorName(parent);
                const authorHandle = getAuthorHandle(parent);
                if (authorName || authorHandle) {
                    targets.push({
                        parentCommentId: mainNoteId || 'unknown',
                        parentCommentUrl: postUrl,
                        parentPostUrl: postUrl,
                        parentCommentContent: originalNoteContent,
                        targetAuthorName: authorName,
                        targetAuthorHandle: authorHandle,
                        targetCommentId: directId,
                        targetCommentUrl: getCommentUrl(parent),
                        targetCommentContent: getCommentText(parent),
                        originalNoteContent,
                    });
                }
            }

            if (replies.length === 0) continue;

            const parentCommentId = directId;
            const parentCommentUrl = getCommentUrl(parent);
            const parentCommentContent = getCommentText(parent);

            for (const reply of replies) {
                const commentId = getCommentId(reply);
                if (!commentId) continue;

                const authorName = getAuthorName(reply);
                const authorHandle = getAuthorHandle(reply);
                if (!authorName && !authorHandle) continue;

                targets.push({
                    parentCommentId: parentCommentId || 'unknown',
                    parentCommentUrl: parentCommentUrl || postUrl,
                    parentPostUrl: postUrl,
                    parentCommentContent,
                    targetAuthorName: authorName,
                    targetAuthorHandle: authorHandle,
                    targetCommentId: commentId,
                    targetCommentUrl: getCommentUrl(reply),
                    targetCommentContent: getCommentText(reply),
                    originalNoteContent,
                });
            }
        }

        // 7. Deduplicate
        const seen = new Set();
        const unique = targets.filter(t => {
            if (seen.has(t.targetCommentId)) return false;
            seen.add(t.targetCommentId);
            return true;
        });

        console.log('🎯 Targets found:', unique.length);
        return unique;
    }

    // Expands reply threads by clicking "Show more replies" until maxReplies reached
    async function expandReplies(maxReplies) {
        for (let round = 0; round < 10; round++) {
            const replyCount = document.querySelectorAll('[class*="feedUnit-"][class*="hasContext-"]').length;
            console.log(`🎯 Expand round ${round + 1}: ${replyCount} replies visible`);
            if (replyCount >= maxReplies) break;

            const btn = findShowMoreButton();
            if (!btn) break;

            console.log('🎯 Clicking:', btn.textContent.trim());
            btn.click();

            // Wait for new units to appear
            const before = document.querySelectorAll('[class*="feedUnit-"]').length;
            await poll(
                () => document.querySelectorAll('[class*="feedUnit-"]').length > before,
                3000, 300
            );
        }
    }

    function findShowMoreButton() {
        return Array.from(document.querySelectorAll('button')).find(btn => {
            const text = btn.textContent?.trim().toLowerCase() || '';
            return text.includes('show more replies') || text.includes('more replies');
        }) || null;
    }

    // ── Blog post page (/p/slug) ──────────────────────────────────────────────

    async function scrapeBlogPage(postUrl) {
        // Expand all reply threads
        const expandBtns = Array.from(document.querySelectorAll('button')).filter(btn => {
            const text = btn.textContent?.trim().toLowerCase() || '';
            return text.includes('show') && text.includes('repl');
        });
        for (const btn of expandBtns) {
            btn.click();
            await sleep(300);
        }
        if (expandBtns.length > 0) await sleep(1500);

        const targets = [];
        document.querySelectorAll('.comment-list-item').forEach(el => {
            const target = extractBlogTarget(el, postUrl);
            if (target) targets.push(target);
        });

        const seen = new Set();
        return targets.filter(t => {
            if (seen.has(t.targetCommentId)) return false;
            seen.add(t.targetCommentId);
            return true;
        });
    }

    function extractBlogTarget(el, postUrl) {
        const parentEl = el.parentElement?.closest('.comment-list-item');
        if (!parentEl || parentEl === el) return null;

        const link = el.querySelector('a[href*="/comment/"]');
        const commentId = link?.href.match(/comment[/-](\d+)/)?.[1] || '';
        if (!commentId) return null;

        const authorLink = el.querySelector('a[href*="/@"]');
        const nameEl = el.querySelector('[class*="weight-medium"], strong');
        const authorName = nameEl?.textContent?.trim() || authorLink?.textContent?.trim() || '';
        const authorHandle = authorLink?.href.match(/\/@([^/?#]+)/)?.[1] || '';
        if (!authorName && !authorHandle) return null;

        const parentLink = parentEl.querySelector('a[href*="/comment/"]');

        return {
            parentCommentId: parentLink?.href.match(/comment[/-](\d+)/)?.[1] || 'unknown',
            parentCommentUrl: parentLink?.href || postUrl,
            parentPostUrl: postUrl,
            parentCommentContent: parentEl.querySelector('.ProseMirror, p')?.textContent?.trim().slice(0, 300) || '',
            targetAuthorName: authorName,
            targetAuthorHandle: authorHandle,
            targetCommentId: commentId,
            targetCommentContent: el.querySelector('.ProseMirror, p')?.textContent?.trim().slice(0, 300) || '',
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXTRACTION HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    // Get the timestamp permalink link that lives in the comment header (not inside body text)
    function getHeaderLink(unit) {
        const body = unit.querySelector('[class*="feedCommentBodyInner"], [class*="feedCommentBody"], .ProseMirror');
        return Array.from(unit.querySelectorAll('a[href*="/note/c-"]'))
            .find(a => !body || !body.contains(a)) || null;
    }

    function getCommentId(unit) {
        return getHeaderLink(unit)?.href.match(/\/note\/c-(\d+)/)?.[1] || '';
    }

    function getCommentUrl(unit) {
        return getHeaderLink(unit)?.href || '';
    }

    function getAuthorName(unit) {
        return unit.querySelector('[class*="weight-medium"] a, [class*="weight-medium"]')?.textContent?.trim() || '';
    }

    function getAuthorHandle(unit) {
        const link = unit.querySelector('a[href*="/profile/"]');
        return link?.href.match(/\/profile\/(?:\d+-)?([^/?#]+)/)?.[1] || '';
    }

    function getCommentText(unit) {
        if (!unit) return '';
        return unit.querySelector('[class*="feedCommentBodyInner"] .ProseMirror, .ProseMirror')
            ?.textContent?.trim().slice(0, 300) || '';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REPLY POSTING
    // ─────────────────────────────────────────────────────────────────────────

    async function postCampaignReply(replyText) {
        // We are on the target comment's own permalink page.
        // The "Leave a reply..." composer sits below the permalink comment.
        console.log('🎯 Posting reply on:', location.href);
        await sleep(2000);

        // Find the reply composer — it sits OUTSIDE the feedPermalinkUnit
        const permalinkEl = document.querySelector('[class*="feedPermalinkUnit"]');
        const composers = Array.from(document.querySelectorAll('[class*="inlineComposer"]'));
        const composer = composers.find(el => !permalinkEl?.contains(el)) || composers[0];

        if (!composer) {
            return fail('Reply composer not found');
        }

        composer.scrollIntoView({ block: 'center' });
        await sleep(500);
        composer.click();
        await sleep(1500);

        // Wait for the editor to open
        const editor = await pollFor(
            () => Array.from(document.querySelectorAll('div[contenteditable="true"]'))
                .find(el => el.getBoundingClientRect().width > 0),
            8000, 500
        );
        if (!editor) return fail('Reply editor did not open');

        // Type the reply
        editor.focus();
        await sleep(200);
        editor.innerHTML = '<p></p>';
        document.execCommand('insertText', false, replyText.trim());
        editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
        await sleep(500);

        // Click Post — retry up to 10s
        const postBtn = await pollFor(
            () => Array.from(document.querySelectorAll('button'))
                .find(b => b.textContent?.trim().toLowerCase() === 'post' && !b.disabled && b.offsetParent),
            10000, 800
        );
        if (!postBtn) return fail('Post button not found or stayed disabled');

        postBtn.click();
        await sleep(3000);

        const id = `posted_${Date.now()}`;
        chrome.runtime.sendMessage({ type: 'CAMPAIGN_REPLY_DONE', success: true, replyCommentId: id });
        return { success: true, replyCommentId: id };
    }

    function fail(error) {
        console.error('🎯', error);
        chrome.runtime.sendMessage({ type: 'CAMPAIGN_REPLY_DONE', success: false, error });
        return { success: false, error };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    // Polls a condition function until it returns truthy or timeout is reached.
    // Returns true/false (for conditions) or the value (for pollFor).
    function poll(condFn, timeout, interval) {
        return new Promise(resolve => {
            const start = Date.now();
            (function check() {
                if (condFn()) return resolve(true);
                if (Date.now() - start >= timeout) return resolve(false);
                setTimeout(check, interval);
            })();
        });
    }

    // Like poll() but resolves with the return value of condFn (or null on timeout)
    function pollFor(valueFn, timeout, interval) {
        return new Promise(resolve => {
            const start = Date.now();
            (function check() {
                const val = valueFn();
                if (val) return resolve(val);
                if (Date.now() - start >= timeout) return resolve(null);
                setTimeout(check, interval);
            })();
        });
    }
})();
