
import fetch from 'node-fetch';

async function testFetchProfile() {
    try {
        // Need to simulate a session/auth usually, but our middleware checks it.
        // For quick testing without auth, I might need to bypass middleware or login first.
        // Or I can checking if the cookie is available.
        // Actually, since I can't easily fake the session cookie without a full login cycle in the script,
        // I will Temporarily disable the requireAuth middleware in substack.ts for this test if needed,
        // OR better: I'll rely on the user to test it in the frontend, OR I can try to login first.

        // Let's simpler: I'll comment out requireAuth in substack.ts temporarily for this test, then revert it.
        // Wait, I can just use the existing auth mechanism if I had a token.

        // Let's try to just hit it and see if I get 401, which confirms route exists at least.
        const res = await fetch('http://localhost:3002/api/substack/fetch-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileUrl: 'https://substack.com/@businessmentalist' })
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Body:', data);

    } catch (e) {
        console.error(e);
    }
}

testFetchProfile();
