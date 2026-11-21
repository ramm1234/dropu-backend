import nodemailer from "nodemailer";
import { env } from "../env";

export const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 6000,
  greetingTimeout: 6000,
  socketTimeout: 6000,
});

async function sendViaHttpApi(to: string, code: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "DropU <onboarding@resend.dev>",
          to: [to],
          subject: `Your DropU Verification Code: ${code}`,
          html: buildHtml(code),
          text: `Your DropU verification code is ${code}. It expires in 5 minutes.`,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "DropU", email: env.GMAIL_USER || "noreply@dropu.app" },
          to: [{ email: to }],
          subject: `Your DropU Verification Code: ${code}`,
          htmlContent: buildHtml(code),
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  return false;
}

function buildHtml(code: string): string {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #F4F7F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F7F6; padding: 40px 15px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #E8ECEB;">
                <tr>
                  <td align="center" style="background-color: #0F7B6C; padding: 32px 24px; color: #FFFFFF;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">DropU</h1>
                    <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Smart Campus & City Rides</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 36px 32px;">
                    <p style="margin: 0 0 16px 0; font-size: 17px; font-weight: 600; color: #1A2E2B;">Verify Your Email</p>
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; color: #526360;">
                      Use the 6-digit verification code below to sign in or create your DropU account.
                    </p>
                    <div style="background-color: #F0F8F6; border: 1.5px dashed #0F7B6C; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
                      <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0F7B6C; font-family: monospace;">${code}</span>
                    </div>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #7B8C89; text-align: center;">
                      ⏱️ This code will expire in <strong>5 minutes</strong>.
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #7B8C89; text-align: center;">
                      Never share this code with anyone.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #FAFCFB; border-top: 1px solid #E8ECEB; padding: 20px 32px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #9AA7A4;">
                      © ${new Date().getFullYear()} DropU. All rights reserved.
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
}

export async function sendOtpEmail(to: string, code: string) {
  // Try HTTP email API first if configured
  const sentViaHttp = await sendViaHttpApi(to, code);
  if (sentViaHttp) return;

  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    console.warn(`[OTP] Gmail credentials not configured. Mock delivery for ${to}: OTP is ${code}`);
    return;
  }

  await mailer.sendMail({
    from: `"DropU" <${env.GMAIL_USER}>`,
    to,
    subject: `Your DropU Verification Code: ${code}`,
    text: `Your DropU verification code is ${code}. It expires in 5 minutes. If you did not request this, please ignore this message.`,
    html: buildHtml(code),
  });
}
