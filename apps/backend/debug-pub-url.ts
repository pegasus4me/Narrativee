
import fetch from 'node-fetch';

async function testPubUrl() {
    const profileUrl = 'https://substack.com/@businessmentalist';
    console.log(`Fetching ${profileUrl}...`);

    try {
        const response = await fetch(profileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();

        let handle = null;
        const handleMatch = profileUrl.match(/@([\w\d]+)/);
        if (handleMatch) {
            handle = handleMatch[1];
        }

        console.log("Handle:", handle);

        let publicationUrl = null;

        // Simple regex to find the first substack subdomain link that isn't www or profile
        const pubMatch = html.match(/class="[^"]*publication-title[^"]*"[^>]*href="(https:\/\/[a-zA-Z0-9-]+\.substack\.com)"/i);

        if (pubMatch) {
            console.log("Found via Regex:", pubMatch[1]);
            publicationUrl = pubMatch[1];
        } else {
            console.log("Regex match failed");
        }

        if (!publicationUrl && handle) {
            publicationUrl = `https://${handle}.substack.com`;
            console.log("Used fallback:", publicationUrl);
        }

        console.log("Final Publication URL:", publicationUrl);

        // Let's print some nearby HTML to see what the publication link actually looks like
        const bodyMatch = html.match(/body/); // just check if we got html
        console.log("Got HTML length:", html.length);

        // Try to find any substack link
        const allLinks = html.match(/href="(https:\/\/[a-zA-Z0-9-]+\.substack\.com)"/g);
        if (allLinks) {
            console.log("First 5 Substack links found:", allLinks.slice(0, 5));
        }

    } catch (e) {
        console.error(e);
    }
}

testPubUrl();
