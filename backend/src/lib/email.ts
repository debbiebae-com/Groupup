import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(to: string, token: string): Promise<{ devToken?: string }> {
  if (!resend || !env.EMAIL_FROM) {
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
    // Email blocked (e.g. free-tier restriction) — don't break the flow.
    // Log the real error and fall back to returning the token for dev.
    console.error("[Resend] send failed, falling back to devToken:", (err as Error).message);
    return { devToken: token };
  }
}