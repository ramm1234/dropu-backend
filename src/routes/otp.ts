import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { sendOtpEmail } from "../lib/mailer";

const otpRouter = new Hono();

type OtpEntry = {
  otp: string;
  expiresAt: number;
};

const otpStore = new Map<string, OtpEntry>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_LENGTH = 6;

function generateOtp(): string {
  let code = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

otpRouter.get("/diag", (c) => {
  return c.json({
    status: "ok",
    hasBrevo: !!process.env.BREVO_API_KEY,
    brevoPrefix: process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim().slice(0, 10) + "..." : null,
    hasResend: !!process.env.RESEND_API_KEY,
    resendPrefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim().slice(0, 6) + "..." : null,
    hasGmailUser: !!process.env.GMAIL_USER,
    gmailUser: process.env.GMAIL_USER || null,
  });
});

otpRouter.post(
  "/send",
  zValidator("json", z.object({ email: z.string().email() })),
  async (c) => {
    const { email } = c.req.valid("json");

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;

    try {
      await sendOtpEmail(email, otp);
      otpStore.set(email, { otp, expiresAt });
      return c.json({
        data: {
          sent: true,
        },
      });
    } catch (err: any) {
      console.error("Failed to send OTP email to", email, ":", err);
      const detail = err?.message || String(err);
      return c.json(
        { error: { message: `Failed to send verification email: ${detail}`, code: "EMAIL_FAILED", detail } },
        502
      );
    }

  }
);

otpRouter.post(
  "/verify",
  zValidator("json", z.object({ email: z.string().email(), otp: z.string() })),
  (c) => {
    const { email, otp } = c.req.valid("json");

    const entry = otpStore.get(email);

    if (!entry || entry.otp !== otp || Date.now() > entry.expiresAt) {
      return c.json(
        { error: { message: "Invalid or expired OTP", code: "INVALID_OTP" } },
        400
      );
    }

    otpStore.delete(email);

    return c.json({ data: { verified: true } });
  }
);

export { otpRouter };
