// Popup script - handles settings and profile
document.addEventListener('DOMContentLoaded', async () => {
    // Settings elements
    const apiKeyInput = document.getElementById('apiKey');
    const toneSelect = document.getElementById('tone');
    const lengthSelect = document.getElementById('length');
    const enabledCheckbox = document.getElementById('enabled');

    // Profile elements
    const bioInput = document.getElementById('bio');
    const goalsInput = document.getElementById('goals');
    const topicsInput = document.getElementById('topics');
    const styleSelect = document.getElementById('style');
    const articlesInput = document.getElementById('articles');

    const saveBtn = document.getElementById('saveBtn');
    const statusEl = document.getElementById('status');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });

    // Load saved settings and profile
    const data = await chrome.storage.sync.get([
        'apiKey', 'tone', 'length', 'enabled',
        'bio', 'goals', 'topics', 'style', 'articles'
    ]);

    // Settings
    if (data.apiKey) apiKeyInput.value = data.apiKey;
    if (data.tone) toneSelect.value = data.tone;
    if (data.length) lengthSelect.value = data.length;
    if (data.enabled !== undefined) enabledCheckbox.checked = data.enabled;

    // Profile
    if (data.bio) bioInput.value = data.bio;
    if (data.goals) goalsInput.value = data.goals;
    if (data.topics) topicsInput.value = data.topics;
    if (data.style) styleSelect.value = data.style;
    if (data.articles) articlesInput.value = data.articles;

    // Save all
    saveBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const tone = toneSelect.value;
        const length = lengthSelect.value;
        const enabled = enabledCheckbox.checked;

        const bio = bioInput.value.trim();
        const goals = goalsInput.value.trim();
        const topics = topicsInput.value.trim();
        const style = styleSelect.value;
        const articles = articlesInput.value.trim();

        if (!apiKey) {
            showStatus('Please enter your API key', 'error');
            return;
        }

        if (!apiKey.startsWith('sk-or-')) {
            showStatus('Invalid OpenRouter API key format', 'error');
            return;
        }

        await chrome.storage.sync.set({
            apiKey, tone, length, enabled,
            bio, goals, topics, style, articles
        });
        showStatus('All settings saved! ✓', 'success');

        // Notify content scripts
        chrome.tabs.query({ url: '*://*.substack.com/*' }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', enabled }).catch(() => { });
            });
        });
    });

    function showStatus(message, type) {
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'status';
        }, 3000);
    }
});
