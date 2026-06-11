import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = "Safoan <hello@narrativee.com>";

interface WeeklyDigestData {
    email: string;
    name: string;
    notesPosted: number;
    totalLikes: number;
    totalComments: number;
    totalRestacks: number;
    newSubscribers: number;
    topNote: { content: string; likes: number } | null;
}

export const EmailService = {
    async sendWeeklyDigest(data: WeeklyDigestData) {
        if (!resend) {
            console.error("❌ RESEND_API_KEY is missing — weekly digest skipped");
            return;
        }
        const { data: result, error } = await resend.emails.send({
            from: FROM,
            to: data.email,
            subject: "Your Narrativee weekly recap",
            html: weeklyDigestHtml(data),
        });
        if (error) console.error('[Email] Weekly digest error:', error);
    },

    async sendWelcome({ email, name, promoCode }: { email: string; name: string; promoCode: string }) {
        if (!resend) {
            console.error("❌ RESEND_API_KEY is missing — welcome email skipped");
            return;
        }
        const { error } = await resend.emails.send({
            from: FROM,
            to: email,
            subject: "Welcome to Narrativee",
            html: welcomeEmailHtml({ name, promoCode }),
        });
        if (error) {
            console.error('[Email] Welcome email error:', error);
        }
    },
};

function welcomeEmailHtml({ name, promoCode }: { name: string; promoCode: string }) {
    const firstName = name?.split(" ")[0] || "there";
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Narrativee</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1b1d;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1b1d 0%,#1e1a2e 100%);padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">✦ Narrativee</div>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">Turn your newsletter into a multi-channel traffic engine</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#ffffff;">Hey ${firstName} 👋</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.6;">
                Welcome to Narrativee. You're now set up to grow your newsletter on autopilot. 
                Use Narrativee to automatically transform your newsletter articles into high-performing social posts and carousels, and publish them directly to your socials to drive consistent new signups.
              </p>

              <!-- Getting Started Steps -->
              <h3 style="margin:24px 0 12px;font-size:16px;font-weight:600;color:#ffffff;">Here is how to get started:</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;color:#9ca3af;font-size:14px;line-height:1.6;">
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:24px;color:#e99ab1;font-weight:bold;">1.</td>
                  <td style="padding:8px 0;"><strong>Connect your newsletter:</strong> Import your Substack, beehiiv, RSS, or custom newsletter feed.</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:24px;color:#e99ab1;font-weight:bold;">2.</td>
                  <td style="padding:8px 0;"><strong>Link your social channels:</strong> Connect your LinkedIn, X (Twitter), or Threads account.</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:24px;color:#e99ab1;font-weight:bold;">3.</td>
                  <td style="padding:8px 0;"><strong>Auto-publish on autopilot:</strong> Let Narrativee extract, format, and schedule high-engaging carousels and posts to drive new signups.</td>
                </tr>
              </table>

              <!-- Promo code block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e1a2e,#1a1b1d);border:1px solid rgba(233,154,177,0.3);border-radius:12px;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:12px;color:#e99ab1;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your welcome gift</p>
                    <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:4px;font-family:monospace;">${promoCode}</div>
                    <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">Use this code at checkout for 50% off on your subscriptions for the first 3 months</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="https://narrativee.com/workspace" style="display:inline-block;background:#e99ab1;color:#000000;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                      Go to your workspace →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                If you have any questions, just reply to this email — we're happy to help.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:#4b5563;">© 2026 Narrativee · <a href="https://narrativee.com" style="color:#6b7280;text-decoration:none;">narrativee.com</a></p>
            </td>
          </tr>

         </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function weeklyDigestHtml(d: WeeklyDigestData) {
    const firstName = d.name?.split(" ")[0] || "there";
    const weekLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const topNoteHtml = d.topNote
        ? `<div style="margin-top:24px;padding:16px;background:#111;border-left:3px solid #f97316;border-radius:6px;">
            <p style="margin:0 0 8px;font-size:11px;color:#f97316;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Top note this week</p>
            <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;line-height:1.5;">"${d.topNote.content.substring(0, 120)}${d.topNote.content.length > 120 ? '...' : ''}"</p>
            <p style="margin:0;font-size:12px;color:#6b7280;">${d.topNote.likes} likes</p>
          </div>`
        : "";

    const stat = (value: number | string, label: string, color: string) =>
        `<td style="text-align:center;padding:16px 8px;">
            <div style="font-size:24px;font-weight:700;color:${color};">${value}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:4px;">${label}</div>
         </td>`;

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1b1d;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1b1d 0%,#1e1a2e 100%);padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:18px;font-weight:700;color:#ffffff;">✦ Narrativee</div>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Weekly recap · ${weekLabel}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#ffffff;">Hey ${firstName}, here's your week</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">Here's what happened on your Substack this week.</p>

          <!-- Stats grid -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:12px;border:1px solid rgba(255,255,255,0.06);margin-bottom:8px;">
            <tr>
              ${stat(d.notesPosted, "Notes posted", "#ffffff")}
              ${stat(`+${d.newSubscribers}`, "New subscribers", "#34d399")}
              ${stat(d.totalLikes, "Likes", "#a78bfa")}
              ${stat(d.totalComments, "Comments", "#fb923c")}
            </tr>
          </table>

          ${topNoteHtml}

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
            <tr><td align="center">
              <a href="https://narrativee.com/workspace" style="display:inline-block;background:#f97316;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">
                View your dashboard →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:12px;color:#4b5563;">© 2026 Narrativee · <a href="https://narrativee.com" style="color:#6b7280;text-decoration:none;">narrativee.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
