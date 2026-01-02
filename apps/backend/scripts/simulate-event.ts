
const API_KEY = "nr-live-a969db13-6a4e-42c4-825e-9101a32dffe8";
const USER_ID = "4q4GG8GadMO1RDmvxcpgiAxhko5M1F6o";
const ENDPOINT = "http://localhost:3002/api/events/track";

async function main() {
    console.log(`📡 Sending 'view_pricing' event for user ${USER_ID} (Simulating 13th click)...`);

    // We assume score is high enough now (since user clicked many times)
    const payload = {
        eventName: "view_pricing",
        userId: USER_ID,
        metadata: { source: "simulation-script" },
        userTraits: { name: "Sim User" }
    };

    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("✅ Response Status:", response.status);
        console.log("📄 Response Data:", JSON.stringify(data, null, 2));

        if (data.actions && data.actions.length > 0) {
            console.log("🎉 SUCCESS: Actions received!");
        } else {
            console.log("❌ FAILURE: No actions received.");
        }

    } catch (err) {
        console.error("❌ Error:", err);
    }
}

main();
