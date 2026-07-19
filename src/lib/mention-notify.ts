import { prisma } from "@/lib/db";
import {
  handleFromName,
  mentionsInText,
  type MentionNotifyResult,
} from "@/lib/mentions";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { propertyLabel } from "@/lib/property-context";

export type { MentionNotifyResult };

type Resolved = { handle: string; name: string; email: string };

async function resolveHandle(handle: string): Promise<Resolved | null> {
  const h = handle.toLowerCase();

  const envKey = `MENTION_EMAIL_${h.toUpperCase()}`;
  const envEmail = process.env[envKey]?.trim();
  if (envEmail) {
    return { handle: h, name: capitalize(h), email: envEmail.toLowerCase() };
  }

  const owners = await prisma.owner.findMany({
    where: { email: { not: null } },
    select: { name: true, email: true },
  });

  const match = owners.find((o) => {
    if (!o.email) return false;
    const handleName = handleFromName(o.name);
    const compact = o.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return handleName === h || compact === h;
  });

  if (match?.email) {
    return { handle: h, name: match.name, email: match.email.toLowerCase() };
  }

  // Convenient fallback: @waqas → admin login email
  if (h === "waqas" && process.env.ADMIN_EMAIL?.trim()) {
    return {
      handle: h,
      name: "Waqas",
      email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
    };
  }

  return null;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function listMentionTargets(propertyId: string) {
  const owners = await prisma.owner.findMany({
    where: { propertyId },
    select: { name: true, email: true },
    orderBy: { name: "asc" },
  });

  const fromOwners = owners
    .map((o) => {
      const handle = handleFromName(o.name);
      if (!handle) return null;
      return {
        handle,
        name: o.name,
        hasEmail: Boolean(
          o.email ||
            process.env[`MENTION_EMAIL_${handle.toUpperCase()}`] ||
            (handle === "waqas" && process.env.ADMIN_EMAIL)
        ),
      };
    })
    .filter(Boolean) as Array<{
    handle: string;
    name: string;
    hasEmail: boolean;
  }>;

  // Ensure classic handles appear even if owners missing
  for (const handle of ["waqas", "naseeb"]) {
    if (!fromOwners.some((t) => t.handle === handle)) {
      const resolved = await resolveHandle(handle);
      fromOwners.push({
        handle,
        name: capitalize(handle),
        hasEmail: Boolean(resolved),
      });
    }
  }

  return fromOwners;
}

export async function notifyMentionedOnNote(opts: {
  handles: string[];
  noteTitle: string;
  noteBody: string;
  propertyId: string;
  authorName?: string | null;
}): Promise<MentionNotifyResult> {
  const result: MentionNotifyResult = {
    emailed: [],
    skipped: [],
    errors: [],
    mailConfigured: isMailConfigured(),
  };

  if (!opts.handles.length) return result;

  if (!result.mailConfigured) {
    result.skipped = [...opts.handles];
    result.errors.push(
      "Email not configured — set RESEND_API_KEY or SMTP_* on the server."
    );
    return result;
  }

  const property = await prisma.property.findUnique({
    where: { id: opts.propertyId },
  });
  const unit = property ? propertyLabel(property) : "Property";

  for (const handle of opts.handles) {
    const resolved = await resolveHandle(handle);
    if (!resolved) {
      result.skipped.push(handle);
      continue;
    }

    const subject = `[Hostora] @${handle} — ${opts.noteTitle}`;
    const text = [
      `Hi ${resolved.name},`,
      ``,
      `You were tagged in a Hostora note.`,
      ``,
      `Property: ${unit}`,
      opts.authorName ? `From: ${opts.authorName}` : null,
      ``,
      `Title: ${opts.noteTitle}`,
      ``,
      opts.noteBody,
      ``,
      `— Hostora`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const html = `
      <div style="font-family:IBM Plex Sans,Segoe UI,sans-serif;line-height:1.5;color:#134E4A;max-width:560px">
        <p style="margin:0 0 12px">Hi <strong>${escape(resolved.name)}</strong>,</p>
        <p style="margin:0 0 16px">You were tagged in a Hostora note.</p>
        <p style="margin:0 0 8px;font-size:13px;color:#5f6b6a">
          <strong>Property:</strong> ${escape(unit)}
          ${opts.authorName ? `<br/><strong>From:</strong> ${escape(opts.authorName)}` : ""}
        </p>
        <div style="border:1px solid #d7e3e1;border-radius:12px;padding:16px;background:#f7faf9">
          <p style="margin:0 0 8px;font-size:16px;font-weight:600">${escape(opts.noteTitle)}</p>
          <p style="margin:0;white-space:pre-wrap;font-size:14px">${escape(opts.noteBody)}</p>
        </div>
        <p style="margin:16px 0 0;font-size:12px;color:#7a8786">Sent by Hostora · mention @${escape(handle)}</p>
      </div>
    `;

    const sent = await sendMail({
      to: resolved.email,
      subject,
      text,
      html,
    });

    if (sent.ok) {
      result.emailed.push(resolved.name);
    } else {
      result.errors.push(`@${handle}: ${sent.error}`);
      result.skipped.push(handle);
    }
  }

  return result;
}

export function handlesFromNote(title: string, body: string) {
  return mentionsInText(title, body);
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
