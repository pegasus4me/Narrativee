"use server"

import { Resend } from "resend";

const FROM = "Safoan <hello@narrativee.com>";

export async function joinWaitlist(email: string) {
  try {
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
            name: email.split("@")[0] || "there"
        }),
      });

      if (error) {
        console.error("Failed to send welcome email:", error);
        return { success: true, emailError: error.message };
      }
    } else {
      console.warn("RESEND_API_KEY not set. Skipping welcome email.");
      return { success: true, emailError: "RESEND_API_KEY not set" };
    }

    return { success: true };
  } catch (error) {
    console.error("Waitlist error:", error);
    return { success: false, error: "Failed to join waitlist" };
  }
}

function welcomeEmailHtml({ name }: { name: string }) {
    const firstName = name;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Narrativee</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;text-align:center;border-bottom:1px solid #e5e7eb;">
              <img src="https://narrativee.com/logoDark.png" alt="Narrativee" height="32" style="display:block;margin:0 auto;" />
              <p style="margin:16px 0 0;color:#111827;font-size:18px;font-weight:600;">Your newsletter, repurposed everywhere.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#111827;">Hey ${firstName}  👋</h1>
              <p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
                It's Safoan from Narrativee, just wanted to welcome you to our waitlist and say thank you for joining us. I've secured your spot!
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                As a fellow creator, I know the struggle of growing your newsletter across multiple platforms. 
              </p>
<p style="margin:0 0 16px;font-size:15px;color:#4b5563;line-height:1.6;">
               I am on a mission to change that by helping you repurpose and distribute your content across all key channels in just a few clicks and efficiently.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#111827;line-height:1.6;font-weight:500;text-align:center;">
                Also, Keep an eye on your inbox—your free playbook will be sent to you shortly! 📘
              </p>

              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                If you have any questions, just reply to this email, I will be happy to help.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">© 2026 Narrativee · <a href="https://narrativee.com" style="color:#64748b;text-decoration:none;">narrativee.com</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
