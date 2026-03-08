// ==========================================
// INSPIRATION NOTES SAVER
// ==========================================

// Add save buttons to Substack notes for inspiration library
(function initInspirationSaver() {
    console.log('💡 [Narrativee] Inspiration saver module loading...');

    const INSPIRATION_BUTTON_CLASS = 'narrativee-inspiration-save';
    const processedNotes = new Set();

    function extractNoteData(noteElement) {
        try {
            const contentEl = noteElement.querySelector('.feedCommentBodyInner-AOzMIC, .ProseMirror');
            const content = contentEl?.textContent?.trim() || '';

            if (content.length < 10) return null;

            const authorEl = noteElement.querySelector('[class*="weight-medium"]');
            const authorLink = noteElement.querySelector('a[href*="/@"]');

            // Robust avatar extraction (matches engagement-scraper.js fix)
            const avatarImg = noteElement.querySelector('img[alt*="Avatar"]')
                || noteElement.querySelector('img[alt*="avatar"]')
                || (authorLink ? authorLink.querySelector('img') : null)
                || noteElement.querySelector('img[src*="substackcdn.com"][src*="profile"]')
                || noteElement.querySelector('img[class*="avatar"], img[class*="photo"], img[class*="profile"]')
                || noteElement.querySelector('img[width="32"], img[width="36"], img[width="40"], img[width="48"]');

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

            const noteLink = noteElement.querySelector('a[href*="/note/c-"]');

            return {
                id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                content: content.slice(0, 500),
                author: {
                    name: authorEl?.textContent?.trim() || 'Unknown',
                    handle: authorLink ? authorLink.getAttribute('href').replace('/@', '').split('?')[0] : '',
                    avatar: avatarImg?.src || '',
                    publicationName: ''
                },
                engagement: { likes, restacks, comments },
                url: noteLink?.href || window.location.href,
                savedAt: new Date().toISOString(),
                tags: [],
                source: 'extension'
            };
        } catch (e) {
            console.error('Error extracting note:', e);
            return null;
        }
    }

    function createInspirationButton(noteElement) {
        const btn = document.createElement('button');
        btn.className = INSPIRATION_BUTTON_CLASS;
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
        `;
        btn.title = 'Save to Inspirations';
        btn.style.cssText = `
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            width: 32px !important;
            height: 32px !important;
            border: none !important;
            border-radius: 50% !important;
            background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%) !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3) !important;
        `;

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const noteData = extractNoteData(noteElement);
            if (!noteData) {
                console.error('Failed to extract note data');
                return;
            }

            try {
                // Use chrome.storage.local (works cross-domain)
                const result = await chrome.storage.local.get(['savedInspirations']);
                const savedNotes = result.savedInspirations || [];

                const exists = savedNotes.some(n => n.url === noteData.url);
                if (exists) {
                    btn.innerHTML = '✓';
                    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%) !important';
                    setTimeout(() => {
                        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>`;
                        btn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%) !important';
                    }, 2000);
                    return;
                }

                savedNotes.unshift(noteData);
                await chrome.storage.local.set({ savedInspirations: savedNotes });

                console.log('💡 Note saved to inspirations!', noteData);

                // Send message to background script to notify web app
                chrome.runtime.sendMessage({
                    type: 'INSPIRATION_SAVED',
                    note: noteData,
                    allNotes: savedNotes
                });

                btn.innerHTML = '✓';
                btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%) !important';

                setTimeout(() => {
                    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>`;
                    btn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%) !important';
                }, 2000);
            } catch (error) {
                console.error('Error saving:', error);
                btn.innerHTML = '❌';
            }
        });

        return btn;
    }

    function injectInspirationButtons() {
        const noteElements = document.querySelectorAll('div[role="article"][aria-label="Note"]');

        noteElements.forEach(noteEl => {
            if (noteEl.dataset.inspirationProcessed) return;
            if (noteEl.querySelector('.gutteredContextRow-g8fRTb')) return; // Skip restacks

            noteEl.dataset.inspirationProcessed = 'true';

            const buttonContainer = noteEl.querySelector('.container-_91AK1');
            if (buttonContainer && !noteEl.querySelector(`.${INSPIRATION_BUTTON_CLASS}`)) {
                const inspirationBtn = createInspirationButton(noteEl);
                buttonContainer.insertBefore(inspirationBtn, buttonContainer.firstChild);
            }
        });
    }

    // Initialize
    setTimeout(() => {
        injectInspirationButtons();
        console.log('💡 [Narrativee] Inspiration buttons injected');
    }, 2000);

    // Watch for new notes
    const observer = new MutationObserver(() => {
        injectInspirationButtons();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
