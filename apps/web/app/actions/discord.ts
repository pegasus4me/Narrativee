"use server";

export async function submitToDiscord(formData: FormData) {
    const email = formData.get("email");
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!email || typeof email !== "string") {
        return { success: false, message: "Invalid email address" };
    }

    if (!webhookUrl) {
        console.error("DISCORD_WEBHOOK_URL is not defined");
        return { success: false, message: "Configuration error" };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: `🚀 **New Beta Signup**\n**Email:** ${email}`,
            }),
        });

        if (!response.ok) {
            throw new Error(`Discord API error: ${response.statusText}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to submit to Discord:", error);
        return { success: false, message: "Failed to submit. Please try again." };
    }
}
