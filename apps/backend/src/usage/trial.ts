export type TrialAccount = {
  trialCreditsRemaining: number;
  trialEndsAt: Date | null;
};

export function trialStatus(account: TrialAccount, now = new Date()) {
  if (!account.trialEndsAt) return "no_trial";
  if (account.trialEndsAt.getTime() <= now.getTime()) return "expired";
  if (account.trialCreditsRemaining <= 0) return "exhausted";
  return "active";
}
