
import fetch from 'node-fetch';

async function checkSoso() {
    const profileUrl = 'https://substack.com/@businessmentalist';
    console.log(`Fetching ${profileUrl}...`);

    try {
        const response = await fetch(profileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();

        console.log("Searching for 'soso'...");
        const sosoMatch = html.match(/soso\.substack\.com/i);
        if (sosoMatch) {
            console.log("Found 'soso.substack.com'!");
        } else {
            console.log("Did NOT find 'soso.substack.com'.");
        }

        console.log("Searching for 'safoan'...");
        const safoanMatch = html.match(/safoan\.substack\.com/i);
        if (safoanMatch) {
            console.log("Found 'safoan.substack.com'!");
        }

    } catch (e) {
        console.error(e);
    }
}

checkSoso();
