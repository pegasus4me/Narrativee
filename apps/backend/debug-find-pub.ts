
import fetch from 'node-fetch';

async function findSpecificPub() {
    const profileUrl = 'https://substack.com/@businessmentalist';
    console.log(`Fetching ${profileUrl}...`);

    try {
        const response = await fetch(profileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();

        console.log("Searching for 'safoan'...");
        const index = html.indexOf('safoan.substack.com');

        if (index !== -1) {
            console.log("Found 'safoan.substack.com' at index:", index);
            const start = Math.max(0, index - 150);
            const end = Math.min(html.length, index + 150);
            console.log("Context:\n", html.substring(start, end));
        } else {
            console.log("Could NOT find 'safoan.substack.com' in the HTML response.");

            // Maybe it's just 'safoan' without substack.com?
            const shortIndex = html.indexOf('safoan');
            if (shortIndex !== -1) {
                console.log("Found 'safoan' at index:", shortIndex);
                const start = Math.max(0, shortIndex - 100);
                const end = Math.min(html.length, shortIndex + 100);
                console.log("Context:\n", html.substring(start, end));
            }
        }

    } catch (e) {
        console.error(e);
    }
}

findSpecificPub();
