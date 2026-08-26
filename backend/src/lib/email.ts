import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const isProd = env.NODE_ENV === "production";

export async function sendVerificationEmail(to: string, token: string): Promise<{ devToken?: string }> {
  if (!resend || !env.EMAIL_FROM) {
    if (isProd) {
      throw new Error("Email provider is not configured");
    }
    console.log(`[DEV] Verification token for ${to}: ${token}`);
    return { devToken: token };
  }

  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Verify your GroupUp student email",
      html: `
        <h2>Verify your GroupUp account</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${token}</p>
        <p>This code expires in 15 minutes.</p>
      `,
    });
    return {};
  } catch (err) {
    console.error("[Resend] send failed:", (err as Error).message);
    if (isProd) {
      // Never leak the token in production — surface a safe error instead.
      throw new Error("Failed to send verification email");
    }
    return { devToken: token };
  }
}