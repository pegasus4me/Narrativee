
// ==========================================
// SUBSCRIBER SCRAPER
// Scrapes free/paid subscriber counts from the Substack publication overview page
// Page: https://[pub].substack.com/publish/overview
// ==========================================

(function initSubsScraper() {
    console.log('📈 [Narrativee] Subscriber scraper loaded');

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SCRAPE_SUBS') {
            console.log('📈 Received SCRAPE_SUBS command');
            scrapeSubs()
                .then(data => {
                    console.log(`📈 Scraped subscriber data:`, data);
                    sendResponse({ success: true, data });
                })
                .catch(err => {
                    console.error('📈 Scrape error:', err);
                    sendResponse({ success: false, error: err.message });
                });
            return true; // async response
        }
    });

    async function scrapeSubs() {
        // Wait for the page to fully render (recharts chart appears after JS runs)
        await new Promise(resolve => setTimeout(resolve, 4000));

        if (!window.location.href.includes('/publish/home') && !window.location.href.includes('/publish/overview')) {
            throw new Error('Not on Substack publish home page');
        }

        console.log('📈 Scraping subscriber data from:', window.location.href);

        // ── Strategy: find stat boxes by their label text ──────────────────
        // HTML structure:
        //   <label>Total subscribers</label>
        //   ...
        //   <h3 class="... value-MNKe0r">
        //     <span class="... color-primary-zABazT">39</span>   ← real value
        //   or
        //     <span class="... color-tertiary-ePI2vV">-</span>   ← no data
        //   </h3>

        const parseNum = (text) => {
            if (!text || text.trim() === '-') return 0;
            const cleaned = text.replace(/,/g, '').trim();
            const v = cleaned.toLowerCase();
            if (v.endsWith('k')) return Math.round(parseFloat(v) * 1000);
            if (v.endsWith('m')) return Math.round(parseFloat(v) * 1000000);
            return parseInt(cleaned, 10) || 0;
        };

        // Find a stat card by its label, then return the value in the sibling h3.value-MNKe0r
        const getStatByLabel = (labelText) => {
            // Find all labels on the page
            const labels = Array.from(document.querySelectorAll('label'));
            const label = labels.find(l =>
                l.textContent?.trim().toLowerCase() === labelText.toLowerCase()
            );
            if (!label) {
                console.log(`📈 Label not found: "${labelText}"`);
                return 0;
            }

            // Walk up to the stat card container, then find the h3 with class value-MNKe0r
            // The label is inside a <div>→<div>→<label> inside the card
            let container = label.closest('a') || label.parentElement?.parentElement?.parentElement;
            if (!container) return 0;

            const valueEl = container.querySelector('[class*="value-"]');
            if (!valueEl) {
                console.log(`📈 Value element not found for label: "${labelText}"`);
                return 0;
            }

            // The span inside may show the actual number or a dash (-)
            const span = valueEl.querySelector('span');
            const text = span?.textContent?.trim() || valueEl.textContent?.trim() || '';
            console.log(`📈 Found "${labelText}": "${text}"`);
            return parseNum(text);
        };

        const totalCount = getStatByLabel('Total subscribers');
        const paidCount = getStatByLabel('Paid subscribers');
        // Free isn't always shown separately; derive it
        const freeCount = totalCount > paidCount ? totalCount - paidCount : getStatByLabel('Free subscribers');

        console.log(`📈 Result → total=${totalCount} paid=${paidCount} free=${freeCount}`);

        if (totalCount === 0 && paidCount === 0) {
            // Log all labels found to help debug
            const allLabels = Array.from(document.querySelectorAll('label')).map(l => l.textContent?.trim());
            console.log('📈 All labels on page:', allLabels);
            throw new Error('Could not find subscriber counts. Labels found: ' + allLabels.join(', '));
        }

        const now = new Date();
        const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        return [{ month: day, freeCount, paidCount, totalCount }];
    }


})();
