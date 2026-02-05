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

        // Also try to inject after delays
        setTimeout(tryInject, 1000);
        setTimeout(tryInject, 2000);
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
            wizardBtn.innerHTML = isNewNote ? '✨' : '🧙‍♂️';
            wizardBtn.title = isNewNote ? 'Generate AI Note' : 'Generate AI Reply';
            wizardBtn.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 50%;
                background: linear-gradient(135deg, ${isNewNote ? '#8b5cf6 0%, #a855f7' : '#ff6b35 0%, #f7931e'} 100%);
                cursor: pointer;
                font-size: 18px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px ${isNewNote ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 107, 53, 0.3)'};
                margin-right: 8px;
            `;

            postButton.parentNode.insertBefore(wizardBtn, postButton);
            console.log(isNewNote ? '✨ Note button injected!' : '🧙‍♂️ Reply button injected!');

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
                            wizardBtn.style.background = `linear-gradient(135deg, ${isNewNote ? '#8b5cf6 0%, #a855f7' : '#ff6b35 0%, #f7931e'} 100%)`;
                            wizardBtn.innerHTML = isNewNote ? '✨' : '🧙‍♂️';
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
                            wizardBtn.innerHTML = isNewNote ? '✨' : '🧙‍♂️';
                        }, 2000);
                    } else {
                        wizardBtn.style.opacity = '1';
                        wizardBtn.innerHTML = isNewNote ? '✨' : '🧙‍♂️';
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
                <span class="wa-title">🪄 AI Writing Assistant</span>
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
                background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
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
                background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
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

    init();
    initWritingAssistant();
})();
