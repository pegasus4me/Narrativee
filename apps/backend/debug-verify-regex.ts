
import fetch from 'node-fetch';

async function testNewRegex() {
    const profileUrl = 'https://substack.com/@businessmentalist';
    console.log(`Fetching ${profileUrl}...`);

    try {
        const response = await fetch(profileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();

        // New Regex targeting data-href
        const chipMatch = html.match(/data-href="(https:\/\/[a-zA-Z0-9-]+\.substack\.com)[^"]*"/i);

        if (chipMatch) {
            console.log("Found via Chip Regex:", chipMatch[1]);
        } else {
            console.log("Chip Regex failed");
        }

    } catch (e) {
        console.error(e);
    }
}

testNewRegex();
