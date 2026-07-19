type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult =
  | { ok: true; provider: "resend" | "smtp" }
  | { ok: false; error: string };

function fromAddress() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "Hostora <onboarding@resend.dev>"
  );
}

async function sendWithResend(input: SendMailInput): Promise<SendMailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(input.text)}</pre>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true, provider: "resend" };
}

async function sendWithSmtp(input: SendMailInput): Promise<SendMailResult> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    return { ok: false, error: "SMTP not configured" };
  }

  const nodemailer = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT || "587");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: fromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { ok: true, provider: "smtp" };
}

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() ||
      (process.env.SMTP_HOST?.trim() &&
        process.env.SMTP_USER?.trim() &&
        process.env.SMTP_PASS?.trim())
  );
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  if (process.env.RESEND_API_KEY?.trim()) {
    return sendWithResend(input);
  }
  if (process.env.SMTP_HOST?.trim()) {
    return sendWithSmtp(input);
  }
  return {
    ok: false,
    error:
      "Email not configured. Set RESEND_API_KEY (free) or SMTP_HOST/SMTP_USER/SMTP_PASS.",
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
