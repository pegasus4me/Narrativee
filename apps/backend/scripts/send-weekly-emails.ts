import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from apps/backend/.env
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("❌ Error: RESEND_API_KEY is not defined in your .env file.");
  process.exit(1);
}

const resend = new Resend(apiKey);
const FROM = "Safoan <hello@narrativee.com>";
const SUBJECT = "The Storyboard #1 | Write in your exact brand voice + create stunning carousels 🎨";

// Beautiful Premium HTML Layout for Narrativee Storyboard Weekly Update
// Beautiful Premium HTML Layout for Narrativee Storyboard Weekly Update
const EMAIL_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The Storyboard #1</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body, table, td, p, a, li, h1, h2, h3 {
      font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0a0b10;font-family:'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b10;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#12141a;border-radius:8px;border:1px solid #242730;overflow:hidden;max-width:600px;width:100%;text-align:left;">
          <!-- Header Banner (No Gradient) -->
          <tr>
            <td style="background:#12141a;padding:40px 40px 30px;border-bottom:1px solid #242730;text-align:center;">
              <img src="https://narrativee.com/logo.png" alt="Narrativee Logo" style="height:36px;display:block;margin:0 auto;" />
              <div style="margin-top:16px;color:#e99ab1;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">The Storyboard #1</div>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#ffffff;line-height:1.7;font-weight:600;">Hey there,</p>
              <p style="margin:0 0 20px;font-size:15px;color:#ffffff;line-height:1.7;">
                Safoan here from Narrativee. Welcome to the very first edition of <strong>The Storyboard</strong>—our new weekly update where I'll be sharing the latest features, refinements, and improvements we're building for you.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#ffffff;line-height:1.7;">
                We’ve been hard at work shipping updates to help you design, preview, and schedule your content with absolute ease. Here is a look at what we launched for you this week:
              </p>

              <!-- Section: What's New -->
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#ffffff;border-bottom:1px solid #242730;padding-bottom:8px;">🚀 What's New</h2>
              
              <div style="margin-bottom:20px;padding:20px;background:#1a1c24;border-radius:8px;border:1px solid #242730;">
                <h3 style="margin:0 0 6px;font-size:15px;font-weight:600;color:#e99ab1;">AI Voice Memory Engine 🧠</h3>
                <p style="margin:0;font-size:14px;color:#ffffff;line-height:1.6;">
                  Narrativee learns your writing style from past content to generate drafts that sound exactly like you.
                </p>
              </div>

              <div style="margin-bottom:20px;padding:20px;background:#1a1c24;border-radius:8px;border:1px solid #242730;">
                <h3 style="margin:0 0 6px;font-size:15px;font-weight:600;color:#e99ab1;">5-Slide Carousel Builder 🎨</h3>
                <p style="margin:0;font-size:14px;color:#ffffff;line-height:1.6;">
                  Create, navigate, and preview visual carousels. Capped at 5 slides to keep your posts punchy and high-converting.
                </p>
              </div>

              <div style="margin-bottom:20px;padding:20px;background:#1a1c24;border-radius:8px;border:1px solid #242730;">
                <h3 style="margin:0 0 6px;font-size:15px;font-weight:600;color:#e99ab1;">Native Threads Previews 🧵</h3>
                <p style="margin:0;font-size:14px;color:#ffffff;line-height:1.6;">
                  See exactly how your post will render on Threads before publishing to keep your spacing and hooks flawless.
                </p>
              </div>

              <div style="margin-bottom:32px;padding:20px;background:#1a1c24;border-radius:8px;border:1px solid #242730;">
                <h3 style="margin:0 0 6px;font-size:15px;font-weight:600;color:#e99ab1;">Free Creator Tools 🧰</h3>
                <p style="margin:0;font-size:14px;color:#ffffff;line-height:1.6;">
                  Access built-in creator utilities instantly via the new dropdown menu in the header.
                </p>
              </div>

              <!-- Section: Improvements & Polish -->
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#ffffff;border-bottom:1px solid #242730;padding-bottom:8px;">✨ Improvements & Polish</h2>
              <ul style="margin:0 0 32px;padding-left:20px;color:#ffffff;font-size:14px;line-height:1.7;">
                <li style="margin-bottom:12px;"><strong style="color:#ffffff;">Redesigned Pricing Modal 💳:</strong> Upgrading your plan is now easier and sleeker with a premium dark-mode aesthetic.</li>
                <li style="margin-bottom:12px;"><strong style="color:#ffffff;">Smarter Landing Page Header:</strong> The header now dynamically hides your username as you scroll down.</li>
              </ul>

              <!-- Section: Bug Fixes & Stability -->
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#ffffff;border-bottom:1px solid #242730;padding-bottom:8px;">🛠️ Bug Fixes & Stability</h2>
              <ul style="margin:0 0 32px;padding-left:20px;color:#ffffff;font-size:14px;line-height:1.7;">
                <li style="margin-bottom:12px;"><strong style="color:#ffffff;">Robust Social Reconnections:</strong> Added soft-disconnect logic to preserve your scheduled queue even if X/Twitter is reconnected.</li>
                <li style="margin-bottom:12px;"><strong style="color:#ffffff;">Better Redirect Flows:</strong> Resolved registration routing issues to land new users directly in onboarding.</li>
              </ul>

              <!-- Creator Tip Block (Rose Accent Color) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#17151a;border:1px solid #3d2a33;border-left:4px solid #e99ab1;border-radius:4px;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:11px;color:#e99ab1;font-weight:700;text-transform:uppercase;letter-spacing:1px;">💡 Tip of the Week</p>
                    <p style="margin:0;font-size:14px;color:#ffffff;line-height:1.6;">
                      Train your Voice Memory Engine with your best-performing content. High-performing newsletters or viral threads make the best learning source material!
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA (Rose Accent Button) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td align="center">
                    <a href="https://narrativee.com/workspace?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=storyboard_1" style="display:inline-block;background:#e99ab1;color:#0a0b10;font-size:14px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:6px;">
                      Go to your workspace →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #242730;text-align:center;background:#0d0e12;">
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;">
                © 2026 Narrativee · <a href="https://narrativee.com?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=storyboard_1" style="color:#e99ab1;text-decoration:none;">narrativee.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#4b5563;">
                You are receiving this because you signed up for Narrativee. If you no longer wish to receive weekly updates, you can unsubscribe at any time.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

async function sendEmail(email: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: SUBJECT,
      html: EMAIL_HTML,
    });
    if (error) {
      console.error(`❌ Failed to send to ${email}:`, error);
      return false;
    }
    console.log(`✅ Successfully sent to ${email} (ID: ${data?.id})`);
    return true;
  } catch (err) {
    console.error(`❌ Error sending to ${email}:`, err);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isSendAll = args.includes("--send");

  if (isDryRun) {
    const testEmailIndex = args.indexOf("--dry-run") + 1;
    const testEmail = args[testEmailIndex];
    if (!testEmail || testEmail.startsWith("-")) {
      console.error("❌ Please provide a test email address: --dry-run <email-address>");
      process.exit(1);
    }
    console.log(`🧪 Running dry-run: Sending a test email to ${testEmail}...`);
    const success = await sendEmail(testEmail);
    if (success) {
      console.log("🎉 Test email sent successfully! Please review the layout in your inbox.");
    }
    process.exit(0);
  }

  if (isSendAll) {
    const emailsFilePath = path.join(__dirname, "..", "emails.txt");
    if (!fs.existsSync(emailsFilePath)) {
      console.error(`❌ Error: emails.txt not found at ${emailsFilePath}`);
      console.log("Please create emails.txt in apps/backend/ containing one email address per line.");
      process.exit(1);
    }

    const fileContent = fs.readFileSync(emailsFilePath, "utf-8");
    const emails = fileContent
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes("@"));

    if (emails.length === 0) {
      console.log("❌ No valid emails found in emails.txt");
      process.exit(1);
    }

    console.log(`🚀 Preparing to send to ${emails.length} subscribers...`);
    console.log("Press Ctrl+C to cancel within 3 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    let successCount = 0;
    for (const email of emails) {
      const success = await sendEmail(email);
      if (success) successCount++;
      // Sleep for 100ms between calls to handle Resend's rate limits smoothly
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Campaign finished: Sent successfully to ${successCount}/${emails.length} subscribers.`);
    process.exit(0);
  }

  // If no arguments provided, show usage help
  console.log(`
ℹ️  Narrativee Email Campaign Utility
-----------------------------------------
Usage:
  1. Test the email layout:
     npx tsx scripts/send-weekly-emails.ts --dry-run <your-email>

  2. Send to your email list:
     - Create a file at 'apps/backend/emails.txt' with one email address per line.
     - Execute the send command:
       npx tsx scripts/send-weekly-emails.ts --send
`);
}

main();
