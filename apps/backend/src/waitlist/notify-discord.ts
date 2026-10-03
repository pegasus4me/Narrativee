interface WaitlistSignup {
  email: string;
  utmSource?: string;
  utmCampaign?: string;
  role?: string;
  firstUseCase?: string;
  currentWorkflow?: string;
  mainPain?: string;
  founderConversation?: boolean;
}

export async function notifyDiscordOfWaitlistSignup(
  signup: WaitlistSignup,
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WAITLIST_WEBHOOK_URL;
  if (!webhookUrl)
    throw new Error("Discord waitlist webhook is not configured.");

  const lines = [
    signup.role
      ? "Narrativee waitlist survey completed — 300 credits reserved"
      : "New Narrativee waitlist signup",
    `Email: ${signup.email}`,
    signup.role ? `Role: ${signup.role}` : null,
    signup.firstUseCase ? `First use case: ${signup.firstUseCase}` : null,
    signup.currentWorkflow
      ? `Current workflow: ${signup.currentWorkflow}`
      : null,
    signup.mainPain ? `Main pain: ${signup.mainPain}` : null,
    signup.role
      ? `Open to founder conversation: ${signup.founderConversation ? "Yes" : "No"}`
      : null,
    signup.utmSource ? `Source: ${signup.utmSource}` : null,
    signup.utmCampaign ? `Campaign: ${signup.utmCampaign}` : null,
  ].filter(Boolean);

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
    throw new Error(
      `Discord waitlist notification failed (${response.status})`,
    );
}
