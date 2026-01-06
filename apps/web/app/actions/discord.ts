"use server";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1451951712326779195/BnSQIdpiUOXJDaJWhGn-t6kGif843XxXqeppfKit_4VbY5lBAFEUp0znAkxSDELQyDTn";

export async function submitToDiscord(formData: FormData) {
    const email = formData.get("email");

    if (!email || typeof email !== "string") {
        return { success: false, message: "Invalid email address" };
    }

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
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
