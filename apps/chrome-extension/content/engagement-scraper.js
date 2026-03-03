// ==========================================
// ENGAGEMENT FEED SCRAPER
// ==========================================

// Scrapes notes from Substack explore/home feed for engagement autopilot
(function initEngagementScraper() {
    console.log('🎯 [Narrativee] Engagement scraper module loading...');

    // Listen for scrape commands from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SCRAPE_ENGAGEMENT_FEED') {
            console.log('🎯 Engagement: Received scrape command');
            scrapeEngagementFeed().then(notes => {
                sendResponse({ success: true, notes });
            }).catch(err => {
                console.error('🎯 Engagement: Scrape error', err);
                sendResponse({ success: false, error: err.message });
            });
            return true; // async response
        }

        if (message.type === 'INSERT_ENGAGEMENT_COMMENT') {
            console.log('🎯 Engagement: Inserting comment on note page');
            insertComment(message.comment, message.autoPost).then(result => {
                sendResponse(result);
            }).catch(err => {
                sendResponse({ success: false, error: err.message });
            });
            return true;
        }
    });

    async function insertComment(commentText, autoPost) {
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 1. STRATEGY: Find the MAIN post's reply area. 
        // We want to avoid replying to sub-comments.
        // On permalink pages, the main post is often in '.feedPermalinkUnit-JBJrHa'
        const mainPostContainer = document.querySelector('.feedPermalinkUnit-JBJrHa, [class*="feedPermalinkUnit"]');

        let replyBtn = null;
        if (mainPostContainer) {
            console.log('🎯 Engagement: Found main post container, searching for reply button within it...');
            const buttons = mainPostContainer.querySelectorAll('button');
            for (const btn of buttons) {
                const label = btn.getAttribute('aria-label') || btn.textContent || '';
                if (label.toLowerCase().includes('comment') || label.toLowerCase().includes('reply')) {
                    replyBtn = btn;
                    break;
                }
            }
        }

        // Fallback to searching everywhere if main container not found (e.g. in a modal)
        if (!replyBtn) {
            console.log('🎯 Engagement: Main post container not found or no reply button within it, searching globally...');
            const allButtons = document.querySelectorAll('button');
            for (const btn of allButtons) {
                const label = btn.getAttribute('aria-label') || btn.textContent || '';
                // Higher priority to buttons that aren't inside a nested comment
                if ((label.toLowerCase().includes('comment') || label.toLowerCase().includes('reply')) &&
                    !btn.closest('.comment-list-item')) {
                    replyBtn = btn;
                    break;
                }
            }
        }

        if (replyBtn) {
            console.log('🎯 Engagement: Clicking reply button');
            replyBtn.click();
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // 2. Find the comment input — retry a few times
        // We prioritize the input that is VISIBLE and not inside a sub-comment if possible
        let input = null;
        for (let i = 0; i < 5; i++) {
            const potentialInputs = Array.from(document.querySelectorAll('div.tiptap.ProseMirror[contenteditable="true"]'));
            // Filter for the one that is most likely the main reply area
            input = potentialInputs.find(ip => {
                const rect = ip.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && !ip.closest('.comment-list-item');
            }) || potentialInputs[0];

            if (input) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!input) {
            console.error('🎯 Engagement: Could not find comment input');
            chrome.runtime.sendMessage({ type: 'ENGAGEMENT_COMMENT_DONE', success: false });
            return { success: false, error: 'No comment input found' };
        }

        // Insert the comment
        input.focus();
        // Clear existing content if any (simulating ctrl+a + backspace)
        input.innerHTML = '<p><br></p>';
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use execCommand for main insertion (most reliable for contenteditable)
        document.execCommand('insertText', false, commentText.trim());

        // Dispatch comprehensive events to trigger state updates
        const events = ['input', 'keydown', 'keyup', 'change'];
        events.forEach(eventType => {
            input.dispatchEvent(new Event(eventType, { bubbles: true }));
        });

        // Specifically for React/ProseMirror: trigger a 'textInput' event
        try {
            const textEvent = document.createEvent('TextEvent');
            textEvent.initTextEvent('textInput', true, true, null, commentText.trim(), 9, "en-US");
            input.dispatchEvent(textEvent);
        } catch (e) {
            // ignore if not supported
        }

        console.log('🎯 Engagement: Comment inserted');

        if (autoPost) {
            // Find and click the "post" button inside the comment area
            let posted = false;

            for (let attempt = 0; attempt < 15; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Search globally for the "Post" button
                // The button typically has class "priority_primary" and text "Post"
                const allButtons = Array.from(document.querySelectorAll('button'));

                // Filter for likely "Post" buttons
                const priorityButtons = allButtons.filter(btn => {
                    const text = btn.textContent?.trim().toLowerCase() || '';
                    const classList = btn.className || '';
                    return text === 'post' &&
                        (classList.includes('priority_primary') || classList.includes('pencraft') || classList.includes('buttonText'));
                });

                // Sort by DOM proximity to our input (fallback heuristic)
                // Assuming the button appears AFTER the input in DOM
                let targetBtn = null;
                if (priorityButtons.length > 0) {
                    // Since we likely just opened a modal/reply box, the last button in the DOM 
                    // is usually the one associated with the active editor.
                    // Or find the one closest to the input.
                    targetBtn = priorityButtons.find(btn => {
                        // Must be visible
                        return btn.offsetParent !== null;
                    });

                    // If multiple visible, pick the one closest in DOM source order (usually after input)
                    if (!targetBtn && priorityButtons.length > 0) targetBtn = priorityButtons[priorityButtons.length - 1];
                }

                if (targetBtn) {
                    if (!targetBtn.disabled) {
                        console.log('🎯 Engagement: Found ENABLED Post button:', targetBtn.textContent?.trim());
                        targetBtn.click();
                        posted = true;
                        break;
                    } else {
                        console.log(`🎯 Engagement: Found Post button but DISABLED. Retrying input simulation... (Attempt ${attempt + 1})`);
                        // Retry activating the input - more aggressively
                        input.focus();
                        // Try deprecated but sometimes effective execCommand
                        document.execCommand('selectAll', false, null);
                        document.execCommand('insertText', false, commentText.trim());

                        // Try setting value directly if it's a textarea (fallback)
                        if (input.tagName === 'TEXTAREA') {
                            input.value = commentText.trim();
                        }

                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
                        input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
                    }
                } else {
                    console.log(`🎯 Engagement: Post button not found yet... (Attempt ${attempt + 1})`);
                }
            }

            if (posted) {
                console.log('🎯 Engagement: Auto-posted comment, waiting for submission...');
                // Wait for the post to actually go through
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.warn('🎯 Engagement: Could not find enabled post button after 15 attempts');
            }

            chrome.runtime.sendMessage({ type: 'ENGAGEMENT_COMMENT_DONE', success: posted });
            return { success: posted, autoPosted: posted };
        }

        // Not auto-posting — just inserted, signal done
        chrome.runtime.sendMessage({ type: 'ENGAGEMENT_COMMENT_DONE', success: true });
        return { success: true, autoPosted: false };
    }

    async function scrapeEngagementFeed() {
        console.log('🎯 Engagement: Starting feed scrape...');
        const notes = [];

        // Auto-scroll to load more content
        for (let i = 0; i < 8; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(resolve => setTimeout(resolve, 1200));
            if (i % 3 === 0) console.log(`🎯 Engagement: Scroll ${i + 1}/8...`);
        }

        // Scrape note elements
        // Filter elements that are NOT nested inside another article (ignores "Related Notes")
        const allPotential = Array.from(document.querySelectorAll('div[role="article"]'));
        const noteElements = allPotential.filter(el => {
            // Check if it's a Note and NOT inside another Note
            const isNote = el.getAttribute('aria-label') === 'Note' || el.querySelector('.feedCommentBodyInner-AOzMIC');
            const isNested = el.parentElement.closest('div[role="article"]');
            return isNote && !isNested;
        });

        console.log('🎯 Engagement: Found', noteElements.length, 'top-level note elements');

        noteElements.forEach(el => {
            try {
                const note = extractEngagementNote(el);
                // Ensure note has a URL and basic content
                if (note && note.content.length > 20 && note.url && note.url.startsWith('https://')) {
                    notes.push(note);
                }
            } catch (e) {
                console.error('🎯 Error extracting note:', e);
            }
        });

        console.log('🎯 Engagement: Extracted', notes.length, 'notes');
        return notes;
    }

    function extractEngagementNote(noteElement) {
        // Skip restacks
        if (noteElement.querySelector('.gutteredContextRow-g8fRTb')) return null;

        const contentEl = noteElement.querySelector('.feedCommentBodyInner-AOzMIC, .ProseMirror');
        const content = contentEl?.textContent?.trim() || '';

        if (content.length < 20) return null;

        // Author info
        const authorEl = noteElement.querySelector('[class*="weight-medium"]');
        const authorLink = noteElement.querySelector('a[href*="/@"]');
        const avatarImg = noteElement.querySelector('img[alt*="Avatar"]');

        // Engagement counts
        const buttons = noteElement.querySelectorAll('.container-_91AK1 button');
        let likes = 0, comments = 0, restacks = 0;

        buttons.forEach(btn => {
            const label = btn.getAttribute('aria-label') || '';
            const countEl = btn.querySelector('[class*="size-13"]');
            const count = parseInt(countEl?.textContent || '0') || 0;

            if (label.toLowerCase().includes('like')) likes = count;
            else if (label.toLowerCase().includes('comment')) comments = count;
            else if (label.toLowerCase().includes('restack')) restacks = count;
        });

        // Note URL extraction
        // STRATEGY 1: The standard timestamp link
        const timeEl = noteElement.querySelector('time');
        let noteUrl = '';

        if (timeEl) {
            const timeLink = timeEl.closest('a');
            if (timeLink?.href) {
                noteUrl = timeLink.href;
            }
        }

        // STRATEGY 2: If <time> is missing or link not found, look for date-like text
        if (!noteUrl) {
            const allLinks = Array.from(noteElement.querySelectorAll('a'));
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
            // STRATEGY 3: Header metadata link search (careful)
            const candidates = Array.from(noteElement.querySelectorAll('a[href*="/note/"], a[href*="/p/"]'));
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

        // Ensure absolute URL
        if (noteUrl && !noteUrl.startsWith('http')) {
            try {
                noteUrl = new URL(noteUrl, window.location.origin).href;
            } catch (e) {
                noteUrl = '';
            }
        }

        // FINAL VALIDATION: Must contain /p/ or /note/ to avoid profile pages
        if (noteUrl) {
            try {
                const urlObj = new URL(noteUrl);
                if (!urlObj.pathname.includes('/p/') && !urlObj.pathname.includes('/note/')) {
                    noteUrl = '';
                }
            } catch (e) {
                noteUrl = '';
            }
        }

        const timestamp = timeEl?.getAttribute('datetime') || timeEl?.textContent || '';

        return {
            id: 'engage_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
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
            scrapedAt: new Date().toISOString()
        };
    }
})();
