
// ==========================================
// STATS SCRAPER
// ==========================================

(function initStatsScraper() {
    console.log('📊 [Narrativee] Stats scraper loaded');

    // Listener for messages from background/popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SCRAPE_STATS') {
            console.log('📊 Received scrape stats command');
            scrapeStats().then(data => {
                sendResponse({ success: true, count: data.length, posts: data });
            }).catch(err => {
                console.error('📊 Scrape error:', err);
                sendResponse({ success: false, error: err.message });
            });
            return true; // async response
        }
    });

    async function scrapeStats() {
        // Ensure we are on the posts dashboard
        if (!window.location.href.includes('/publish/posts')) {
            throw new Error('Not on Substack Posts Dashboard');
        }

        const rows = document.querySelectorAll('.pencraft.pc-display-flex.pc-gap-16.pc-padding-bottom-16.pc-padding-top-16.pc-align-items-center');
        console.log(`📊 Found ${rows.length} post rows (approx)`);

        const posts = [];

        // Strategy: Look for the main table rows. 
        // Substack dashboard structure is complex and often changes.
        // We look for elements that contain "Published" status or typical stat icons.

        // Let's try a more generic approach by finding the list items
        const listItems = document.querySelectorAll('div[role="row"], .post-list-item, div.pencraft.pc-display-flex.pc-flex-direction-column.pc-gap-12.pc-padding-16');

        // If specific selectors fail, we might need to iterate generic containers
        const containers = listItems.length > 0 ? listItems : document.querySelectorAll('div.pencraft.pc-display-flex');

        for (const row of containers) {
            try {
                // Title
                const titleEl = row.querySelector('a.post-list-item-title, h3, div.pencraft.pc-text-title-s');
                const titleKey = titleEl?.textContent?.trim();

                if (!titleKey) continue;

                // URL
                const linkEl = row.querySelector('a[href*="/p/"]');
                let url = linkEl ? linkEl.href : '';
                if (!url && titleEl && titleEl.tagName === 'A') url = titleEl.href;

                // Only process if it looks like a post
                if (!url || !url.includes('/p/')) continue;

                // Date
                const dateEl = row.querySelector('time');
                const publishedAt = dateEl ? dateEl.getAttribute('datetime') : null;

                // Metrics - Improved scraping
                const stats = {
                    views: 0,
                    openRate: 0,
                    likes: 0,
                    comments: 0
                };

                // Substack dashboard usually has stats in divs with numeric text
                // We'll look for all pencraft text elements and try to map them by position or content
                const metricEls = Array.from(row.querySelectorAll('.pencraft, span, div'))
                    .filter(el => {
                        const text = el.textContent?.trim() || "";
                        // Look for numbers, percentages, or "k"/"m" suffixes
                        return /^[\d,.]+%?$/.test(text) || /^[\d,.]+[km]$/i.test(text);
                    });

                // Heuristic mapping (this is brittle but better than zero)
                // Typically: [Views] [Open Rate] [Likes] [Comments]
                if (metricEls.length >= 1) {
                    const parseMetric = (text) => {
                        if (!text) return 0;
                        let val = text.toLowerCase().replace(/,/g, '').replace(/%/g, '');
                        if (val.endsWith('k')) return parseFloat(val) * 1000;
                        if (val.endsWith('m')) return parseFloat(val) * 1000000;
                        return parseInt(val) || 0;
                    };

                    // Often the first one is views
                    stats.views = parseMetric(metricEls[0].textContent);

                    // If the second one has a %, it's open rate
                    if (metricEls[1] && metricEls[1].textContent.includes('%')) {
                        stats.openRate = parseMetric(metricEls[1].textContent);
                        if (metricEls[2]) stats.likes = parseMetric(metricEls[2].textContent);
                        if (metricEls[3]) stats.comments = parseMetric(metricEls[3].textContent);
                    } else {
                        // Otherwise fallback to positional
                        if (metricEls[1]) stats.likes = parseMetric(metricEls[1].textContent);
                        if (metricEls[2]) stats.comments = parseMetric(metricEls[2].textContent);
                    }
                }

                posts.push({
                    title: titleKey,
                    url: new URL(url).href, // normalize
                    substackId: url.split('/p/')[1]?.split('/')[0],
                    publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
                    ...stats
                });

            } catch (e) {
                console.warn('📊 Skipped a row', e);
            }
        }

        console.log(`📊 Extracted ${posts.length} posts`);
        return posts;
    }

})();
