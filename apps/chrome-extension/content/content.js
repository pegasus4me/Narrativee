// Content script - runs on Substack Notes pages
(function () {
    'use strict';

    console.log('🧙‍♂️ Substack Comment Wizard: Content script loaded');

    let isEnabled = true;

    // Listen for settings updates
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SETTINGS_UPDATED') {
            isEnabled = message.enabled;
            console.log('🧙‍♂️ Settings updated, enabled:', isEnabled);
        }

        if (message.type === 'NARRATIVEE_STATS_SCRAPED') {
            console.log('🧙‍♂️ Received stats from background, forwarding to web app');
            window.postMessage({ type: 'NARRATIVEE_STATS_SCRAPED', posts: message.posts }, '*');
            // Keep legacy support
            window.postMessage({ type: 'EXTENSION_STATS_SCRAPED', posts: message.posts }, '*');
        }

        if (message.type === 'NARRATIVEE_STATS_SYNC_ERROR') {
            console.error('🧙‍♂️ Stats sync error from background', message.error);
            window.postMessage({ type: 'NARRATIVEE_STATS_SYNC_ERROR', error: message.error }, '*');
            // Keep legacy support
            window.postMessage({ type: 'EXTENSION_STATS_SYNC_ERROR', error: message.error }, '*');
        }

        // Notes performance sync
        if (message.type === 'NARRATIVEE_NOTES_PERF_SCRAPED') {
            console.log('📝 Forwarding scraped notes to web app');
            window.postMessage({ type: 'NARRATIVEE_NOTES_PERF_SCRAPED', notes: message.notes, error: message.error }, '*');
        }

        // Subscriber sync
        if (message.type === 'NARRATIVEE_SUBS_SCRAPED') {
            console.log('📈 Forwarding scraped subs to web app');
            window.postMessage({ type: 'NARRATIVEE_SUBS_SCRAPED', data: message.data, error: message.error }, '*');
        }
    });

    // Listen for messages from Narrativee Web App
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        if (event.data?.type === 'NARRATIVEE_PUBLISH_POST') {
            console.log('Post request received from Web App:', event.data.payload);
            chrome.runtime.sendMessage({
                type: 'OPEN_SUBSTACK_DRAFT',
                draft: event.data.payload
            });
        }

        if (event.data?.type === 'NARRATIVEE_START_STATS_SYNC') {
            console.log('🧙‍♂️ Stats sync requested from Web App');
            chrome.runtime.sendMessage({
                type: 'START_STATS_SYNC',
                publicationUrl: event.data.publicationUrl
            });
        }

        if (event.data?.type === 'NARRATIVEE_START_NOTES_PERF_SYNC') {
            console.log('📝 Notes perf sync requested from Web App');
            chrome.runtime.sendMessage({
                type: 'START_NOTES_PERF_SYNC',
                profileUrl: event.data.profileUrl
            });
        }

        if (event.data?.type === 'NARRATIVEE_START_SUBS_SYNC') {
            console.log('📈 Subs sync requested from Web App');
            chrome.runtime.sendMessage({
                type: 'START_SUBS_SYNC',
                publicationUrl: event.data.publicationUrl
            });
        }
    });

    // Initialize
    async function init() {
        console.log('🧙‍♂️ Initializing...');

        try {
            const settings = await chrome.storage.sync.get(['enabled']);
            isEnabled = settings.enabled !== false;
        } catch (e) {
            console.log('🧙‍♂️ Could not load settings, using defaults');
        }

        // Start observing immediately
        observeForReplyInputs();

        // Check for pending drafts from Narrativee
        checkPendingDraft();

        // Also try to inject after delays
        setTimeout(tryInject, 1000);
        setTimeout(tryInject, 2000);
    }

    async function checkPendingDraft() {
        console.log('🔵 Narrativee: checkPendingDraft() called on', window.location.href);

        if (!window.location.hostname.includes('substack.com')) {
            console.log('🔵 Narrativee: Not on substack.com, skipping');
            return;
        }

        try {
            const data = await chrome.storage.local.get(['pending_draft']);
            console.log('🔵 Narrativee: Storage data:', data);

            if (data.pending_draft) {
                console.log('🔵 Narrativee: Found pending draft!', data.pending_draft);

                // Clear it immediately so we don't re-paste on refresh
                await chrome.storage.local.remove('pending_draft');
                console.log('🔵 Narrativee: Draft cleared from storage');

                // Try to find the editor and insert
                // We'll retry a few times as the page loads
                retryInsertDraft(data.pending_draft, 0);
            } else {
                console.log('🔵 Narrativee: No pending draft found in storage');
            }
        } catch (e) {
            console.error('🔵 Narrativee: Error checking draft', e);
        }
    }

    function retryInsertDraft(draft, attempt) {
        const MAX_ATTEMPTS = 30; // Wait up to 15s total

        if (attempt > MAX_ATTEMPTS) {
            console.error('🔵 Narrativee: GAVE UP after', MAX_ATTEMPTS, 'attempts.');
            const warning = document.createElement('div');
            warning.style.cssText = "position:fixed;top:10px;right:10px;background:#ef4444;color:white;padding:15px 20px;border-radius:8px;z-index:999999;font-family:sans-serif;";
            warning.innerHTML = `<strong>Narrativee:</strong> Could not open Notes dialog.<br>Please paste your content manually.`;
            document.body.appendChild(warning);
            setTimeout(() => warning.remove(), 10000);
            return;
        }

        if (attempt === 0) {
            console.log('🔵 Narrativee: Starting draft insertion flow...');
        }

        // STEP 1: Check if the dialog is already open (look for the editor)
        const editor = document.querySelector('div.tiptap.ProseMirror[contenteditable="true"]');

        if (editor) {
            // Dialog is open! Inject the content
            console.log('🔵 Narrativee: 🎉 Found editor! Injecting draft...');

            // Focus the editor
            editor.focus();

            // Clear any existing placeholder content
            editor.innerHTML = '';

            // Use document.execCommand to simulate typing (works with React/contenteditable)
            // This is the most reliable way to trigger React's change detection
            const textToInsert = draft.content.trim();

            // Insert text using execCommand - this triggers input events properly
            document.execCommand('insertText', false, textToInsert);

            // Also dispatch a comprehensive set of events
            editor.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: textToInsert
            }));
            editor.dispatchEvent(new Event('change', { bubbles: true }));
            editor.dispatchEvent(new Event('blur', { bubbles: true }));
            editor.dispatchEvent(new Event('focus', { bubbles: true }));

            console.log('🔵 Narrativee: Content injected using execCommand!');

            // Wait a moment for Substack to process, then proceed
            setTimeout(() => {
                startAutoPostSequence(editor);
            }, 500);
            return;
        }

        // STEP 2: Dialog not open yet. Try to click the trigger button.
        if (attempt < 5) {
            // Look for the "What's on your mind?" trigger
            // Try specific selectors first, then broad text search
            const trigger = document.querySelector('.inlineComposer-v8PLSi') ||
                document.querySelector('[class*="inlineComposer"]') ||
                document.querySelector('div[class*="cursor-pointer"][class*="pencraft"]') ||
                // Fallback: Find element with "What's on your mind?" text
                Array.from(document.querySelectorAll('div, button')).find(el =>
                    el.textContent?.includes("What's on your mind?") &&
                    !el.closest('.tiptap') // Exclude if inside an editor
                );

            if (trigger && !trigger.dataset.narrativeeClicked) {
                console.log('🔵 Narrativee: Found trigger button, clicking to open dialog...', trigger);
                trigger.dataset.narrativeeClicked = 'true';
                trigger.click();
            } else if (!trigger) {
                console.log('🔵 Narrativee: Looking for trigger button... (attempt', attempt, ')');
            }
        }

        // Retry
        setTimeout(() => retryInsertDraft(draft, attempt + 1), 500);
    }

    function startAutoPostSequence(editor) {
        console.log('🔵 Narrativee: Starting Auto-Post sequence...');
        findPostButtonWithRetry(0);
    }

    function findPostButtonWithRetry(attempt) {
        const MAX_ATTEMPTS = 15;

        if (attempt >= MAX_ATTEMPTS) {
            console.error('🔵 Narrativee: Could not find Post button after', MAX_ATTEMPTS, 'attempts!');
            const warning = document.createElement('div');
            warning.style.cssText = "position:fixed;top:10px;right:10px;background:#ef4444;color:white;padding:15px 20px;border-radius:8px;z-index:999999;font-family:sans-serif;";
            warning.innerHTML = `<strong>Narrativee:</strong> Could not find Post button.<br>Please click Post manually.`;
            document.body.appendChild(warning);
            setTimeout(() => warning.remove(), 10000);
            return;
        }

        let postBtn = null;

        // GLOBAL SEARCH STRATEGY (ported from engagement-scraper fix)
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
        if (priorityButtons.length > 0) {
            // Since we likely just opened a modal/reply box, the last button in the DOM 
            // is usually the one associated with the active editor.
            // Or find the one closest to the input.
            postBtn = priorityButtons.find(btn => {
                // Must be visible
                return btn.offsetParent !== null;
            });

            // If multiple visible, pick the one closest in DOM source order (usually after input)
            if (!postBtn && priorityButtons.length > 0) postBtn = priorityButtons[priorityButtons.length - 1];
        }

        // Log diagnostic info
        if (!postBtn && attempt === 0) {
            console.log('🔵 Narrativee: Searching for Post button...');
            console.log('🔵 Narrativee: All buttons found:', Array.from(allButtons).map(b => b.textContent?.trim()).filter(t => t));
        }

        if (postBtn) {
            console.log('🔵 Narrativee: Found Post button!', postBtn.textContent?.trim());
            checkButtonAndProceed(postBtn);
        } else {
            // Retry
            console.log('🔵 Narrativee: Post button not found yet, retry', attempt + 1);
            setTimeout(() => findPostButtonWithRetry(attempt + 1), 500);
        }
    }

    function checkButtonAndProceed(postBtn) {
        // Check if button is disabled (needs content)
        if (postBtn.disabled) {
            console.log('🔵 Narrativee: Post button is disabled, waiting for Substack to detect content...');
            // Retry multiple times with increasing delays
            retryUntilEnabled(postBtn, 0);
        } else {
            proceedWithAutoPost(postBtn);
        }
    }

    function retryUntilEnabled(postBtn, attempt) {
        const MAX_RETRIES = 10;

        if (attempt >= MAX_RETRIES) {
            console.log('🔵 Narrativee: Button still disabled after', MAX_RETRIES, 'attempts. User may need to click Post manually.');
            const warning = document.createElement('div');
            warning.style.cssText = "position:fixed;top:10px;right:10px;background:#f59e0b;color:white;padding:15px 20px;border-radius:8px;z-index:999999;font-family:sans-serif;";
            warning.innerHTML = `<strong>Narrativee:</strong> Content inserted but Post button not enabled.<br>Please click Post manually.`;
            document.body.appendChild(warning);
            setTimeout(() => warning.remove(), 10000);
            return;
        }

        setTimeout(() => {
            if (!postBtn.disabled) {
                console.log('🔵 Narrativee: Post button is now enabled! Proceeding...');
                proceedWithAutoPost(postBtn);
            } else {
                console.log('🔵 Narrativee: Button still disabled, retry', attempt + 1, '/', MAX_RETRIES);
                retryUntilEnabled(postBtn, attempt + 1);
            }
        }, 500);
    }

    function proceedWithAutoPost(postBtn) {
        // Create Countdown Overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            text-align: center;
        `;

        let timeLeft = 3;
        overlay.innerHTML = `
            <div style="font-size: 80px; font-weight: bold; margin-bottom: 20px;">${timeLeft}</div>
            <div style="font-size: 24px; margin-bottom: 40px;">Auto-Posting to Substack...</div>
            <button id="narrativee-cancel" style="
                background: #ef4444; 
                color: white; 
                border: none; 
                padding: 15px 40px; 
                font-size: 20px; 
                border-radius: 8px; 
                cursor: pointer;
                font-weight: bold;
            ">CANCEL</button>
        `;
        document.body.appendChild(overlay);

        // Timer Loop
        const timer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                const div = overlay.querySelector('div');
                if (div) div.textContent = timeLeft;
            } else {
                // TIME UP!
                clearInterval(timer);
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                console.log('🔵 Narrativee: CLICKING POST BUTTON!', postBtn);
                postBtn.click();

                // Wait for the post to go through, then signal completion
                setTimeout(() => {
                    console.log('🔵 Narrativee: Post submitted, sending NOTE_POSTED signal');
                    try {
                        chrome.runtime.sendMessage({ type: 'NOTE_POSTED', success: true });
                    } catch (e) {
                        console.warn('🔵 Narrativee: Could not send NOTE_POSTED signal', e);
                    }

                    // Show success notification
                    const successBanner = document.createElement('div');
                    successBanner.style.cssText = "position:fixed;top:10px;right:10px;background:#22c55e;color:white;padding:15px 20px;border-radius:8px;z-index:999999;font-family:sans-serif;font-weight:bold;";
                    successBanner.textContent = '✓ Narrativee: Note posted!';
                    document.body.appendChild(successBanner);
                    setTimeout(() => successBanner.remove(), 5000);
                }, 5000);
            }
        }, 1000);

        // Handle Cancel
        const cancelBtn = overlay.querySelector('#narrativee-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                clearInterval(timer);
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
                console.log('🔵 Narrativee: Auto-Post CANCELLED by user.');
            });
        }
    }

    function tryInject() {
        injectWizardButtons();
    }

    // Extract Note context - look for the MAIN post on the permalink page
    function getNoteContext() {
        let noteText = '';
        let author = 'Unknown Author';

        // Helper to get all text from a container with proper paragraphs
        function extractFullText(container) {
            if (!container) return '';
            // Use innerText to preserve line breaks, or get each paragraph
            const paragraphs = container.querySelectorAll('p');
            if (paragraphs.length > 0) {
                return Array.from(paragraphs).map(p => p.textContent.trim()).filter(t => t).join('\n\n');
            }
            return container.innerText?.trim() || container.textContent?.trim() || '';
        }

        // On a permalink page, the main post has feedCommentBody
        // Try multiple selectors for the main post content
        const selectors = [
            '.feedPermalinkUnit-JBJrHa .feedCommentBody-UWho7S .ProseMirror',
            '.feedPermalinkUnit-JBJrHa .ProseMirror.FeedProseMirror',
            '[class*="feedPermalinkUnit"] [class*="feedCommentBody"] .ProseMirror',
            '[class*="feedPermalink"] .ProseMirror'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && !noteText) {
                noteText = extractFullText(el);
                if (noteText) {
                    console.log('🧙‍♂️ Found main post content with selector:', selector);
                    break;
                }
            }
        }

        // Get author from main post
        const authorSelectors = [
            '.feedPermalinkUnit-JBJrHa .weight-medium-fw81nC',
            '[class*="feedPermalinkUnit"] [class*="weight-medium"]',
            '[class*="feedPermalink"] a[href*="@"]'
        ];
        for (const selector of authorSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                author = el.textContent.trim();
                break;
            }
        }

        // Fallback: If in a modal, look for the note content being replied to
        if (!noteText) {
            const modal = document.querySelector('[class*="modal"]');
            if (modal) {
                const contents = modal.querySelectorAll('[class*="feedCommentBody"] .ProseMirror');
                contents.forEach(el => {
                    if (!noteText && !el.closest('[class*="editor"]') && !el.closest('[class*="textEditor"]')) {
                        noteText = extractFullText(el);
                        if (noteText) console.log('🧙‍♂️ Found modal content');
                    }
                });
            }
        }

        // Last fallback: find any ProseMirror content that's not the editor
        if (!noteText) {
            document.querySelectorAll('.ProseMirror.FeedProseMirror').forEach(el => {
                if (!noteText && !el.closest('[class*="textEditor"]') && !el.closest('[class*="editor"]')) {
                    noteText = extractFullText(el);
                    if (noteText) console.log('🧙‍♂️ Found fallback content');
                }
            });
        }

        console.log('🧙‍♂️ Full context extracted:', noteText.length, 'chars');
        console.log('🧙‍♂️ Context preview:', { author, noteText: noteText.substring(0, 500) + (noteText.length > 500 ? '...' : '') });
        return {
            title: 'Substack Note',
            author,
            content: noteText.substring(0, 4000),
            isNote: true
        };
    }

    // Find reply inputs and inject wizard buttons
    function injectWizardButtons() {
        if (!isEnabled) return;

        // Enhanced selectors for Substack Notes tab based on user's HTML
        // The container has class "feedUnit-NTpfyQ"
        const noteElements = document.querySelectorAll('.feedUnit-NTpfyQ, .feed-item2, .feed-item, .post-preview, .portable-archive-item');

        // Find all contenteditable elements
        const allEditable = document.querySelectorAll('[contenteditable="true"]');

        allEditable.forEach((input) => {
            if (input.dataset.wizardInjected) return;

            // Find Post button nearby
            let postButton = null;
            let searchEl = input.parentElement;
            for (let i = 0; i < 10 && searchEl; i++) {
                const buttons = searchEl.querySelectorAll('button');
                buttons.forEach(btn => {
                    if (btn.textContent?.trim() === 'Post') {
                        postButton = btn;
                    }
                });
                if (postButton) break;
                searchEl = searchEl.parentElement;
            }

            if (!postButton) return;

            // Detect if this is a NEW NOTE or a REPLY
            const placeholder = input.querySelector('[data-placeholder]');
            const placeholderText = placeholder?.dataset.placeholder || '';
            const isNewNote = placeholderText.includes("What's on your mind");

            console.log('🧙‍♂️ Found editor with placeholder:', placeholderText, 'isNewNote:', isNewNote);
            input.dataset.wizardInjected = 'true';

            // Create appropriate button
            const wizardBtn = document.createElement('button');
            wizardBtn.className = isNewNote ? 'substack-note-btn' : 'substack-wizard-btn';
            wizardBtn.type = 'button';
            wizardBtn.innerHTML = '✨';
            wizardBtn.title = isNewNote ? 'Generate AI Note' : 'Generate AI Reply';
            wizardBtn.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 50%;
                background: #316aff;
                cursor: pointer;
                font-size: 18px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(49, 106, 255, 0.3);
                margin-right: 8px;
            `;

            postButton.parentNode.insertBefore(wizardBtn, postButton);
            console.log('✨ Button injected!');

            // Handle click
            wizardBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (wizardBtn.dataset.loading === 'true') return;
                wizardBtn.dataset.loading = 'true';
                wizardBtn.style.opacity = '0.6';
                wizardBtn.innerHTML = '⏳';

                try {
                    if (!chrome.runtime?.id) {
                        throw new Error('Please refresh the page after reloading the extension');
                    }

                    let response;

                    if (isNewNote) {
                        // For new notes, prompt for topic
                        const topic = prompt('What do you want to write about?');
                        if (!topic) {
                            throw new Error('Cancelled');
                        }
                        response = await chrome.runtime.sendMessage({
                            type: 'GENERATE_NOTE',
                            topic
                        });

                        if (response.success) {
                            // Insert note content with proper paragraphs
                            const paragraphs = response.note.split('\n').filter(p => p.trim());
                            input.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.focus();
                        }
                    } else {
                        // For replies, use existing context extraction
                        const context = getNoteContext();
                        response = await chrome.runtime.sendMessage({
                            type: 'GENERATE_COMMENT',
                            context
                        });

                        if (response.success) {
                            input.innerHTML = `<p>${response.comment}</p>`;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.focus();
                        }
                    }

                    if (response.success) {
                        wizardBtn.style.opacity = '1';
                        wizardBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                        wizardBtn.innerHTML = '✓';

                        setTimeout(() => {
                            wizardBtn.style.background = '#316aff';
                            wizardBtn.innerHTML = '✨';
                        }, 2000);
                    } else {
                        throw new Error(response.error || 'Failed');
                    }
                } catch (error) {
                    console.error('🧙‍♂️ Error:', error);
                    if (error.message !== 'Cancelled') {
                        wizardBtn.style.opacity = '1';
                        wizardBtn.innerHTML = '❌';

                        if (error.message?.includes('refresh')) {
                            alert('Extension was reloaded. Please refresh this page.');
                        }

                        setTimeout(() => {
                            wizardBtn.innerHTML = '✨';
                        }, 2000);
                    } else {
                        wizardBtn.style.opacity = '1';
                        wizardBtn.innerHTML = '✨';
                    }
                } finally {
                    wizardBtn.dataset.loading = 'false';
                }
            });
        });
    }

    // Observe for dynamically loaded content
    function observeForReplyInputs() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (
                            node.querySelector?.('[contenteditable="true"]') ||
                            node.hasAttribute?.('contenteditable')
                        )) {
                            shouldCheck = true;
                        }
                    });
                }
            });

            if (shouldCheck) {
                clearTimeout(window.wizardTimeout);
                window.wizardTimeout = setTimeout(injectWizardButtons, 300);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ==========================================
    // ARTICLE WRITING ASSISTANT
    // ==========================================

    function isPublishPage() {
        return window.location.pathname.includes('/publish');
    }

    function injectWritingAssistant() {
        if (document.getElementById('writing-assistant-bar')) return;
        if (!isPublishPage()) return;

        console.log('🪄 Injecting Writing Assistant...');

        // Create the assistant bar
        const bar = document.createElement('div');
        bar.id = 'writing-assistant-bar';
        bar.innerHTML = `
            <div class="wa-header">
                <span class="wa-title">✨ Narrativee AI Assistant</span>
                <button class="wa-close" title="Close">×</button>
            </div>
            <div class="wa-input-row">
                <textarea class="wa-prompt" placeholder="What do you want to write about? (e.g., 'Write an intro about morning routines')"></textarea>
            </div>
            <div class="wa-actions">
                <button class="wa-btn wa-primary" data-action="write">✍️ Write</button>
                <button class="wa-btn" data-action="expand">📝 Expand</button>
                <button class="wa-btn" data-action="rewrite">🔄 Rewrite</button>
                <button class="wa-btn" data-action="headlines">💡 Headlines</button>
                <button class="wa-btn" data-action="outline">📋 Outline</button>
            </div>
            <div class="wa-result" style="display: none;">
                <div class="wa-result-label">Generated Content:</div>
                <div class="wa-result-content"></div>
                <div class="wa-result-actions">
                    <button class="wa-btn wa-secondary" data-result-action="copy">📋 Copy</button>
                    <button class="wa-btn wa-primary" data-result-action="insert">➕ Insert at Cursor</button>
                </div>
            </div>
            <div class="wa-error" style="display: none;"></div>
            <div class="wa-loading" style="display: none;">⏳ Generating...</div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            #writing-assistant-bar {
                position: fixed;
                top: 60px;
                right: 20px;
                width: 380px;
                background: #1a1a1a;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #fff;
                overflow: hidden;
            }
            .wa-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: #316aff;
            }
            .wa-title {
                font-weight: 600;
                font-size: 14px;
            }
            .wa-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                opacity: 0.8;
            }
            .wa-close:hover { opacity: 1; }
            .wa-input-row {
                padding: 12px;
            }
            .wa-prompt {
                width: 100%;
                padding: 10px 12px;
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 8px;
                color: #fff;
                font-size: 13px;
                resize: vertical;
                min-height: 60px;
                font-family: inherit;
            }
            .wa-prompt:focus {
                outline: none;
                border-color: #8b5cf6;
            }
            .wa-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                padding: 0 12px 12px;
            }
            .wa-btn {
                padding: 8px 12px;
                background: #333;
                border: 1px solid #444;
                border-radius: 6px;
                color: #fff;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .wa-btn:hover {
                background: #444;
                border-color: #555;
            }
            .wa-btn.wa-primary {
                background: #316aff;
                border: none;
            }
            .wa-btn.wa-primary:hover {
                opacity: 0.9;
            }
            .wa-btn.wa-secondary {
                background: #444;
            }
            .wa-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .wa-result {
                padding: 12px;
                border-top: 1px solid #333;
            }
            .wa-result-label {
                font-size: 11px;
                color: #888;
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            .wa-result-content {
                background: #2a2a2a;
                border-radius: 8px;
                padding: 12px;
                max-height: 200px;
                overflow-y: auto;
                font-size: 13px;
                line-height: 1.5;
                white-space: pre-wrap;
            }
            .wa-result-actions {
                display: flex;
                gap: 8px;
                margin-top: 10px;
            }
            .wa-error {
                padding: 12px;
                color: #ef4444;
                font-size: 13px;
            }
            .wa-loading {
                padding: 12px;
                text-align: center;
                color: #888;
            }
        `;
        document.head.appendChild(styles);
        document.body.appendChild(bar);

        // Event handlers
        const closeBtn = bar.querySelector('.wa-close');
        const promptInput = bar.querySelector('.wa-prompt');
        const resultDiv = bar.querySelector('.wa-result');
        const resultContent = bar.querySelector('.wa-result-content');
        const errorDiv = bar.querySelector('.wa-error');
        const loadingDiv = bar.querySelector('.wa-loading');

        closeBtn.addEventListener('click', () => {
            bar.style.display = 'none';
        });

        // Action buttons
        bar.querySelectorAll('.wa-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                const prompt = promptInput.value.trim();

                // Get selected text from editor
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();

                // Get editor context
                const editor = document.querySelector('.tiptap.ProseMirror[data-testid="editor"]');
                const titleEl = document.querySelector('#post-title');
                const context = {
                    title: titleEl?.value || '',
                    existingContent: editor?.textContent?.substring(0, 500) || ''
                };

                // Validate input
                if ((action === 'write' || action === 'outline') && !prompt) {
                    showError('Please enter a prompt first');
                    return;
                }
                if ((action === 'expand' || action === 'rewrite') && !selectedText) {
                    showError('Please select some text in the editor first');
                    return;
                }
                if (action === 'headlines' && !context.existingContent) {
                    showError('Please write some content first');
                    return;
                }

                showLoading(true);
                hideError();
                hideResult();

                try {
                    let response;
                    switch (action) {
                        case 'write':
                            response = await chrome.runtime.sendMessage({
                                type: 'WRITE_SECTION',
                                prompt,
                                context
                            });
                            break;
                        case 'expand':
                            response = await chrome.runtime.sendMessage({
                                type: 'EXPAND_TEXT',
                                text: selectedText,
                                context
                            });
                            break;
                        case 'rewrite':
                            response = await chrome.runtime.sendMessage({
                                type: 'REWRITE_TEXT',
                                text: selectedText,
                                context
                            });
                            break;
                        case 'headlines':
                            response = await chrome.runtime.sendMessage({
                                type: 'SUGGEST_HEADLINES',
                                content: context.existingContent
                            });
                            break;
                        case 'outline':
                            response = await chrome.runtime.sendMessage({
                                type: 'GENERATE_OUTLINE',
                                topic: prompt
                            });
                            break;
                    }

                    if (response.success) {
                        const content = response.content || response.headlines || response.outline;
                        showResult(content);
                    } else {
                        throw new Error(response.error);
                    }
                } catch (error) {
                    showError(error.message);
                } finally {
                    showLoading(false);
                }
            });
        });

        // Result action buttons
        bar.querySelector('[data-result-action="copy"]').addEventListener('click', () => {
            const content = resultContent.textContent;
            navigator.clipboard.writeText(content);
            bar.querySelector('[data-result-action="copy"]').textContent = '✓ Copied!';
            setTimeout(() => {
                bar.querySelector('[data-result-action="copy"]').textContent = '📋 Copy';
            }, 2000);
        });

        bar.querySelector('[data-result-action="insert"]').addEventListener('click', () => {
            const content = resultContent.innerHTML;
            const editor = document.querySelector('.tiptap.ProseMirror[data-testid="editor"]');

            if (editor) {
                // Insert at end or where cursor is
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (editor.contains(range.commonAncestorContainer)) {
                        // Insert at cursor
                        const frag = range.createContextualFragment(content);
                        range.insertNode(frag);
                    } else {
                        // Append to editor
                        editor.innerHTML += content;
                    }
                } else {
                    editor.innerHTML += content;
                }
                editor.dispatchEvent(new Event('input', { bubbles: true }));
                hideResult();
            }
        });

        function showError(msg) {
            errorDiv.textContent = msg;
            errorDiv.style.display = 'block';
        }

        function hideError() {
            errorDiv.style.display = 'none';
        }

        function showResult(content) {
            // Clean up HTML for display
            resultContent.innerHTML = content;
            resultDiv.style.display = 'block';
        }

        function hideResult() {
            resultDiv.style.display = 'none';
        }

        function showLoading(show) {
            loadingDiv.style.display = show ? 'block' : 'none';
        }

        console.log('🪄 Writing Assistant injected!');
    }

    // Also inject writing assistant on publish pages
    function initWritingAssistant() {
        if (isPublishPage()) {
            setTimeout(injectWritingAssistant, 1000);
            setTimeout(injectWritingAssistant, 2000);
        }
    }

    // Watch for navigation to publish page
    let lastPath = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            if (isPublishPage()) {
                setTimeout(injectWritingAssistant, 500);
            }
        }
    }, 500);

    // ==========================================
    // NARRATIVEE BRIDGE (Localhost & Production Listener)
    // ==========================================
    const isNarrativee = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === 'narrativee.com' ||
        window.location.hostname === 'www.narrativee.com';

    if (isNarrativee) {
        console.log('Bridge: Listening for Narrativee events...');

        // VISUAL DEBUG: Add a red border to body to prove injection works
        document.body.style.border = "5px solid red";
        setTimeout(() => { document.body.style.border = "none"; }, 3000); // Remove after 3s

        // Handshake: Tell the web app we are here AND send profile data
        setInterval(async () => {
            try {
                // We need to ask background for sensitive data or just read storage if allowed
                // content scripts can read storage.sync
                const settings = await chrome.storage.sync.get(['bio', 'goals', 'topics', 'style']);

                // Construct a "source" object from this
                // We might not have the name/avatar unless we scraped it, 
                // but we at least have the "bio" which implies a connected profile.
                const profileData = {
                    connected: true,
                    bio: settings.bio,
                    goals: settings.goals
                };

                window.postMessage({
                    type: 'NARRATIVEE_EXTENSION_READY',
                    payload: profileData
                }, '*');
            } catch (e) {
                // Fallback if storage access fails
                window.postMessage({ type: 'NARRATIVEE_EXTENSION_READY' }, '*');
            }
        }, 1000);

        window.addEventListener('message', async (event) => {
            // Validate origin if needed, but for localhost dev it's fine
            const { type, payload } = event.data || {};

            if (type === 'NARRATIVEE_PUBLISH_POST') {
                console.log('Bridge: Received publish request', payload);
                try {
                    const response = await chrome.runtime.sendMessage({
                        type: 'OPEN_SUBSTACK_DRAFT',
                        draft: payload
                    });
                    console.log('Bridge: Sent to background', response);
                } catch (err) {
                    console.error('Bridge: Failed to send to background', err);
                }
            }
        });
    }

    init();
    initWritingAssistant();
    initNotesSync();

    // Notes Sync Feature
    function initNotesSync() {
        console.log('🔄 Narrativee: Initializing notes sync listener...');

        // 1. Listen for "Start Sync" from Web App
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'NARRATIVEE_START_SYNC') {
                console.log('🔄 Narrativee: Received sync request for', event.data.profileUrl);
                chrome.runtime.sendMessage({
                    type: 'START_NOTES_SYNC',
                    profileUrl: event.data.profileUrl
                });
            }

            // Web app requests saved inspirations
            if (event.data?.type === 'NARRATIVEE_GET_INSPIRATIONS') {
                console.log('💡 Bridge: Web app requested inspirations');
                chrome.storage.local.get(['savedInspirations'], (result) => {
                    const notes = result.savedInspirations || [];
                    console.log('💡 Bridge: Sending', notes.length, 'inspirations to web app');
                    window.postMessage({
                        type: 'NARRATIVEE_INSPIRATIONS_LOADED',
                        notes: notes
                    }, '*');
                });
            }

            // Web app requests engagement feed scrape
            if (event.data?.type === 'NARRATIVEE_PULL_ENGAGEMENT_FEED') {
                console.log('🎯 Bridge: Web app requested engagement feed');
                chrome.runtime.sendMessage({
                    type: 'SCRAPE_ENGAGEMENT_FEED'
                });
            }

            // Web app deleted an inspiration — remove from chrome.storage.local
            if (event.data?.type === 'NARRATIVEE_DELETE_INSPIRATION') {
                const idToRemove = event.data.id;
                console.log('💡 Bridge: Deleting inspiration', idToRemove, 'from chrome.storage.local');
                chrome.storage.local.get(['savedInspirations'], (result) => {
                    const saved = result.savedInspirations || [];
                    const updated = saved.filter(n => n.id !== idToRemove);
                    chrome.storage.local.set({ savedInspirations: updated }, () => {
                        console.log('💡 Bridge: Deleted, remaining:', updated.length);
                    });
                });
            }

            // Web app requests comment posting
            if (event.data?.type === 'NARRATIVEE_POST_COMMENT') {
                console.log('🎯 Bridge: Web app requesting comment post to', event.data.noteUrl);
                chrome.runtime.sendMessage({
                    type: 'POST_ENGAGEMENT_COMMENT',
                    noteUrl: event.data.noteUrl,
                    comment: event.data.comment,
                    autoPost: event.data.autoPost
                });
            }
        });

        // 2. Listen for messages from Background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'SCRAPE_NOTES_ON_LOAD') {
                console.log('🔄 Narrativee: Received scrape command');
                scrapeNotesAndSendBack();
            }

            // 3. Listen for Synced Data from Background (Web App Tab)
            if (message.type === 'NARRATIVEE_NOTES_SYNCED') {
                console.log('🔄 Narrativee: Received synced notes', message.notes.length);
                window.postMessage({
                    type: 'NARRATIVEE_NOTES_SYNCED',
                    notes: message.notes
                }, '*');
            }

            // 4. Forward saved inspiration from Background to Web App
            if (message.type === 'NARRATIVEE_INSPIRATION_SAVED') {
                console.log('💡 Bridge: Forwarding saved inspiration to web app', message.note);
                window.postMessage({
                    type: 'NARRATIVEE_INSPIRATION_SAVED',
                    note: message.note
                }, '*');
            }

            // 5. Forward engagement feed from Background to Web App
            if (message.type === 'NARRATIVEE_ENGAGEMENT_FEED_LOADED') {
                console.log('🎯 Bridge: Forwarding engagement feed to web app', message.notes?.length, 'notes');
                window.postMessage({
                    type: 'NARRATIVEE_ENGAGEMENT_FEED_LOADED',
                    notes: message.notes
                }, '*');
            }

            // 6. Forward comment posted result from Background to Web App
            if (message.type === 'NARRATIVEE_COMMENT_POSTED') {
                console.log('🎯 Bridge: Forwarding comment posted result to web app');
                window.postMessage({
                    type: 'NARRATIVEE_COMMENT_POSTED',
                    noteUrl: message.noteUrl,
                    success: message.success
                }, '*');
            }
        });

        // 5. On app domains, automatically load saved inspirations for the web app
        if (isNarrativee) {
            setTimeout(() => {
                chrome.storage.local.get(['savedInspirations'], (result) => {
                    const notes = result.savedInspirations || [];
                    if (notes.length > 0) {
                        console.log('💡 Bridge: Auto-sending', notes.length, 'saved inspirations to web app');
                        window.postMessage({
                            type: 'NARRATIVEE_INSPIRATIONS_LOADED',
                            notes: notes
                        }, '*');
                    }
                });
            }, 1500);
        }
    }

    async function scrapeNotesAndSendBack() {
        console.log('🔄 Narrativee: Scraping notes...');
        const notes = [];

        // Auto-scroll to load more content
        console.log('🔄 Narrativee: Auto-scrolling to load more content...');

        // Perform 15 scrolls with delays to load deeper history
        for (let i = 0; i < 15; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if we have enough items? optional, but let's just force depth for now
            if (i % 5 === 0) console.log(`🔄 Narrativee: Scroll ${i + 1}/15...`);
        }

        // Enhanced selectors for Substack Notes tab based on user's HTML
        // The container has class "feedUnit-NTpfyQ"
        const noteElements = document.querySelectorAll('.feedUnit-NTpfyQ, .feed-item2, .feed-item, .post-preview, .portable-archive-item');

        console.log('🔄 Narrativee: Found potential elements:', noteElements.length);

        noteElements.forEach(el => {
            try {
                // Selector strategy from user HTML:
                // Content is in .feedCommentBody-UWho7S .ProseMirror
                // Date is in time element or .date or inside a link with specific class

                const contentEl = el.querySelector('.feedCommentBody-UWho7S .ProseMirror') ||
                    el.querySelector('.feedCommentBody-UWho7S') ||
                    el.querySelector('.ProseMirror') ||
                    el.querySelector('.post-preview-content') ||
                    el.querySelector('.pencraft');

                if (!contentEl) return;

                const text = contentEl.innerText?.trim();
                if (!text) return;

                // Extract date
                // User HTML: <a title="Feb 9, 2026, 3:03 PM" ...>1h</a>
                const timeEl = el.querySelector('time') || el.querySelector('a[title*=","]');
                let time = new Date().toISOString();
                if (timeEl) {
                    const titleAttr = timeEl.getAttribute('title');
                    if (titleAttr) {
                        time = new Date(titleAttr).toISOString();
                    } else {
                        time = timeEl.innerText;
                    }
                }

                // Extract permalink
                // User HTML: href="/@businessmentalist/note/c-212111444?"
                const linkEl = el.querySelector('a[href*="/note/"]') || el.querySelector('a.post-preview-title');
                const url = linkEl ? linkEl.href : '';

                // Identify if it's likely a note (short, no big title)
                const isNote = url.includes('/note/') || window.location.href.includes('/notes');

                notes.push({
                    content: text,
                    date: time,
                    url: url,
                    isNote: isNote,
                    source: 'substack_scrape'
                });
            } catch (e) {
                console.error('Error parsing note item:', e);
            }
        });

        console.log('🔄 Narrativee: Scraped', notes.length, 'notes. Sending back...');

        chrome.runtime.sendMessage({
            type: 'NOTES_SCRAPED',
            notes: notes
        });
    }
})();
