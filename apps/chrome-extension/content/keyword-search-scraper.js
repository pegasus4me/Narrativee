// ==========================================
// KEYWORD SEARCH SCRAPER (substack.com/explore)
// ==========================================
// Automates keyword search on Substack's explore page and scrapes
// the resulting notes for the campaign feature.

(function initKeywordSearchScraper() {
    console.log('🔍 [Narrativee] Keyword search scraper loaded');

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === 'SEARCH_KEYWORD_NOTES') {
            console.log('🔍 Keyword search: Received command for keyword:', message.keyword);
            searchAndScrape(message.keyword)
                .then(notes => sendResponse({ success: true, notes }))
                .catch(err => {
                    console.error('🔍 Keyword search: Error', err);
                    sendResponse({ success: false, error: err.message, notes: [] });
                });
            return true; // async response
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN FLOW
    // ─────────────────────────────────────────────────────────────────────────

    async function searchAndScrape(keyword) {
        console.log('🔍 Step 1: Looking for search input on explore page...');

        // 1. Click the global search input to open the search dialog
        const searchInput = await pollFor(
            () => document.querySelector('input[type="search"][name="search"], input[placeholder*="Search Substack"]'),
            10000, 500
        );
        if (!searchInput) throw new Error('Search input not found on explore page');

        searchInput.click();
        searchInput.focus();
        await sleep(1000);

        // 2. Wait for the search dialog input to appear
        console.log('🔍 Step 2: Waiting for search dialog...');
        const dialogInput = await pollFor(
            () => document.querySelector('input[name="search-dialog-input"], input#headlessui-combobox-input-P0-0, input[role="combobox"][type="search"]'),
            8000, 500
        );
        if (!dialogInput) throw new Error('Search dialog did not open');

        // 3. Type the keyword into the dialog input
        console.log('🔍 Step 3: Typing keyword:', keyword);
        dialogInput.focus();
        await sleep(300);

        // Clear existing text first
        dialogInput.value = '';
        dialogInput.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(200);

        // Type character by character for natural simulation
        for (const char of keyword) {
            dialogInput.value += char;
            dialogInput.dispatchEvent(new Event('input', { bubbles: true }));
            dialogInput.dispatchEvent(new Event('change', { bubbles: true }));
            await sleep(50);
        }
        await sleep(1000);

        // 4. Click the search suggestion that matches our keyword
        console.log('🔍 Step 4: Looking for search suggestion to click...');
        const suggestion = await pollFor(() => {
            // Look for the suggestion row containing our keyword text and a search icon
            const rows = document.querySelectorAll('div[class*="cursor-pointer"], li[role="option"], div[role="option"]');
            for (const row of rows) {
                const text = row.textContent?.trim().toLowerCase() || '';
                if (text.includes(keyword.toLowerCase())) {
                    return row;
                }
            }
            // Fallback: look for any clickable row with a search icon inside the combobox options
            const options = document.querySelectorAll('[id*="headlessui-combobox-option"], [role="option"]');
            for (const opt of options) {
                const text = opt.textContent?.trim().toLowerCase() || '';
                if (text.includes(keyword.toLowerCase())) {
                    return opt;
                }
            }
            return null;
        }, 5000, 500);

        if (suggestion) {
            console.log('🔍 Clicking suggestion:', suggestion.textContent?.trim());
            suggestion.click();
        } else {
            // Fallback: press Enter to submit the search
            console.log('🔍 No suggestion found, pressing Enter to search...');
            dialogInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            dialogInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }

        // 5. Wait for the search results page to load
        console.log('🔍 Step 5: Waiting for search results to load...');
        await sleep(3000);

        // Wait for note elements to appear in the results
        const resultsReady = await poll(
            () => {
                const articles = document.querySelectorAll('div[role="article"], [class*="feedUnit-"], [class*="feedCommentBodyInner"]');
                return articles.length > 0;
            },
            15000, 1000
        );

        if (!resultsReady) {
            console.warn('🔍 No results found after waiting. Page may not have loaded.');
            return [];
        }

        // 6. Scroll to load more results
        console.log('🔍 Step 6: Scrolling to load more results...');
        for (let i = 0; i < 10; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await sleep(1500);
            if (i % 3 === 0) console.log(`🔍 Scroll ${i + 1}/10...`);
        }

        // 7. Scrape notes from the results
        console.log('🔍 Step 7: Scraping notes from search results...');
        const notes = scrapeNotes();
        console.log('🔍 Done! Found', notes.length, 'notes');
        return notes;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NOTE EXTRACTION (mirrors engagement-scraper.js logic)
    // ─────────────────────────────────────────────────────────────────────────

    function scrapeNotes() {
        const notes = [];

        // Collect all top-level article elements
        const allPotential = Array.from(document.querySelectorAll('div[role="article"]'));
        const noteElements = allPotential.filter(el => {
            const isNote = el.getAttribute('aria-label') === 'Note'
                || !!el.querySelector('[class*="feedCommentBodyInner"]');
            const isNested = el.parentElement?.closest('div[role="article"]');
            return isNote && !isNested;
        });

        // If no role="article" notes found, try feedUnit elements
        let elements = noteElements;
        if (elements.length === 0) {
            elements = Array.from(document.querySelectorAll('[class*="feedUnit-"]')).filter(el => {
                return !el.parentElement?.closest('[class*="feedUnit-"]');
            });
        }

        console.log('🔍 Found', elements.length, 'top-level note elements');

        elements.forEach(el => {
            try {
                const note = extractNote(el);
                if (note && note.content.length > 20 && note.url && note.url.startsWith('https://')) {
                    notes.push(note);
                }
            } catch (e) {
                console.error('🔍 Error extracting note:', e);
            }
        });

        // Deduplicate by URL
        const seen = new Set();
        return notes.filter(n => {
            if (seen.has(n.url)) return false;
            seen.add(n.url);
            return true;
        });
    }

    function extractNote(el) {
        // Skip restacks
        if (el.querySelector('[class*="gutteredContextRow"]')) return null;

        const contentEl = el.querySelector('[class*="feedCommentBodyInner"], .ProseMirror');
        const content = contentEl?.textContent?.trim() || '';
        if (content.length < 20) return null;

        // Author info
        const authorEl = el.querySelector('[class*="weight-medium"]');
        const authorLink = el.querySelector('a[href*="/@"]');
        const avatarImg = el.querySelector('img[alt*="Avatar"]')
            || el.querySelector('img[alt*="avatar"]')
            || (authorLink ? authorLink.querySelector('img') : null)
            || el.querySelector('img[src*="substackcdn.com"][src*="profile"]')
            || el.querySelector('img[class*="avatar"], img[class*="photo"], img[class*="profile"]')
            || el.querySelector('img[width="36"], img[width="40"], img[width="48"]');

        // Engagement counts
        let likes = 0, comments = 0, restacks = 0;
        const allClickables = el.querySelectorAll('a, button, div[role="button"], div[aria-label]');

        allClickables.forEach(clickable => {
            const label = (clickable.getAttribute('aria-label') || clickable.getAttribute('title') || '').toLowerCase();
            const href = (clickable.getAttribute('href') || '').toLowerCase();

            let count = 0;
            const textContent = clickable.textContent?.trim() || '';
            if (textContent.length > 0 && textContent.length < 15) {
                const cleanText = textContent.replace(/,/g, '');
                const match = cleanText.match(/([\d.]+)([KMkm]?)/);
                if (match) {
                    const num = parseFloat(match[1]);
                    const suffix = match[2].toLowerCase();
                    if (suffix === 'k') count = Math.floor(num * 1000);
                    else if (suffix === 'm') count = Math.floor(num * 1000000);
                    else count = Math.floor(num);
                }
            }

            if (label.includes('like')) likes = likes || count;
            else if (label.includes('comment') || href.includes('#comment')) comments = comments || count;
            else if (label.includes('restack') || label.includes('repost')) restacks = restacks || count;
            if (href.includes('comments') && !comments) comments = count;
        });

        // Note URL
        let noteUrl = '';
        const timeEl = el.querySelector('time');
        if (timeEl) {
            const timeLink = timeEl.closest('a');
            if (timeLink?.href) noteUrl = timeLink.href;
        }

        if (!noteUrl) {
            const allLinks = Array.from(el.querySelectorAll('a'));
            const dateRegex = /^(\d+[hmdayw]|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Yesterday|Today)/i;
            for (const link of allLinks) {
                if (link.href.includes('/@') || link.querySelector('img')) continue;
                const text = link.textContent?.trim() || '';
                if (text.length < 15 && dateRegex.test(text)) {
                    noteUrl = link.href;
                    break;
                }
            }
        }

        if (!noteUrl) {
            const candidates = Array.from(el.querySelectorAll('a[href*="/note/"], a[href*="/p/"]'));
            for (const link of candidates) {
                if (link.closest('.likes-list') || link.closest('.restacks-list')) continue;
                if (link.href.includes('/@') && !link.href.includes('/note/')) continue;
                const hasMetaStyle = link.querySelector('[class*="size-13"]') || link.querySelector('[class*="color-secondary"]');
                const textLen = link.textContent?.trim().length || 0;
                if (hasMetaStyle && textLen < 20) {
                    noteUrl = link.href;
                    break;
                }
            }
        }

        if (noteUrl && !noteUrl.startsWith('http')) {
            try { noteUrl = new URL(noteUrl, window.location.origin).href; }
            catch { noteUrl = ''; }
        }

        if (noteUrl) {
            try {
                const urlObj = new URL(noteUrl);
                if (!urlObj.pathname.includes('/p/') && !urlObj.pathname.includes('/note/')) noteUrl = '';
            } catch { noteUrl = ''; }
        }

        const timestamp = timeEl?.getAttribute('datetime') || timeEl?.textContent || '';

        return {
            id: 'search_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            content: content.slice(0, 800),
            author: {
                name: authorEl?.textContent?.trim() || 'Unknown',
                handle: authorLink ? authorLink.getAttribute('href').replace('/@', '').split('?')[0].split('/')[0] : '',
                avatar: avatarImg?.src || '',
            },
            engagement: { likes, restacks, comments },
            totalEngagement: likes + restacks + comments,
            url: noteUrl,
            timestamp,
            scrapedAt: new Date().toISOString(),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

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
