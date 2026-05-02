"use server"

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "Safoan <hello@narrativee.com>";

export async function joinWaitlist(email: string) {
  try {
    // 1. Notify Discord
    await fetch("https://discord.com/api/webhooks/1498053728945569934/QKmykdAyZp4o0hBKejVnT8VGpjObW2TprgGx_6zjomv4PMcg2cKHLKjo8BU_L6AjHVCX", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `🎉 New Waitlist Signup: **${email}**`
      }),
    });

    // 2. Send Welcome Email
    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Welcome to Narrativee + Your Free Playbook",
        html: welcomeEmailHtml({ 
            name: email.split("@")[0] || "there", 
            promoCode: "NARRATIVEE40" 
        }),
      });

      if (error) {
        console.error("Failed to send welcome email:", error);
      }
    } else {
      console.warn("RESEND_API_KEY not set. Skipping welcome email.");
    }

    return { success: true };
  } catch (error) {
    console.error("Waitlist error:", error);
    return { success: false, error: "Failed to join waitlist" };
  }
}

function welcomeEmailHtml({ name, promoCode }: { name: string; promoCode: string }) {
    const firstName = name;
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
              <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">Your AI copilot for Substack growth</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#ffffff;">Hey ${firstName} 👋</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.6;">
                Welcome to the Narrativee waitlist. We've secured your spot! You're one step closer to growing your Substack faster — scheduling notes, analyzing metrics, and letting AI match your voice perfectly.
              </p>

              <!-- Promo code block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e1a2e,#1a1b1d);border:1px solid rgba(139,92,246,0.3);border-radius:12px;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:12px;color:#a78bfa;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your welcome gift</p>
                    <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:4px;font-family:monospace;">${promoCode}</div>
                    <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">Use this code at checkout for 40% off on your subscriptions for the first 2 months</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="https://narrativee.com/playbook.pdf" style="display:inline-block;background:#f97316;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                      Download Free Playbook →
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
