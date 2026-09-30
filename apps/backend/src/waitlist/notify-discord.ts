interface WaitlistSignup {
  email: string;
  utmSource?: string;
  utmCampaign?: string;
}

export async function notifyDiscordOfWaitlistSignup(signup: WaitlistSignup): Promise<void> {
  const webhookUrl = process.env.DISCORD_WAITLIST_WEBHOOK_URL;
  if (!webhookUrl) return;

  const lines = [
    "New Narrativee waitlist signup",
    `Email: ${signup.email}`,
    signup.utmSource ? `Source: ${signup.utmSource}` : null,
    signup.utmCampaign ? `Campaign: ${signup.utmCampaign}` : null,
  ].filter(Boolean);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: lines.join("\n"),
        allowed_mentions: { parse: [] },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error(`Waitlist Discord notification failed (${response.status})`);
  } catch {
    console.error("Waitlist Discord notification failed");
  }
}
