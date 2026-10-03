interface WaitlistSignup {
  email: string;
  utmSource?: string;
  utmCampaign?: string;
  role: string;
  firstUseCase: string;
  currentWorkflow: string;
  mainPain: string;
  founderConversation: boolean;
}

export async function notifyDiscordOfWaitlistSignup(
  signup: WaitlistSignup,
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WAITLIST_WEBHOOK_URL;
  if (!webhookUrl) return;

  const lines = [
    "New Narrativee waitlist survey completed",
    `Email: ${signup.email}`,
    `Role: ${signup.role}`,
    `First use case: ${signup.firstUseCase}`,
    `Current workflow: ${signup.currentWorkflow}`,
    `Main pain: ${signup.mainPain}`,
    `Open to founder conversation: ${signup.founderConversation ? "Yes" : "No"}`,
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
    if (!response.ok)
      console.error(
        `Waitlist Discord notification failed (${response.status})`,
      );
  } catch {
    console.error("Waitlist Discord notification failed");
  }
}
