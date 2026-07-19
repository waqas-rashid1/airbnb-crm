export type MentionTarget = {
  handle: string;
  name: string;
  hasEmail: boolean;
};

export type MentionNotifyResult = {
  emailed: string[];
  skipped: string[];
  errors: string[];
  mailConfigured: boolean;
};

/** Extract unique @handles from free text (letters, numbers, underscore). */
export function extractMentions(text: string): string[] {
  const matches = text.matchAll(/@([a-zA-Z][a-zA-Z0-9_]{0,39})/g);
  const seen = new Set<string>();
  const handles: string[] = [];
  for (const m of matches) {
    const h = m[1].toLowerCase();
    if (!seen.has(h)) {
      seen.add(h);
      handles.push(h);
    }
  }
  return handles;
}

export function mentionsInText(title: string, body: string): string[] {
  return extractMentions(`${title}\n${body}`);
}

/** Handles present in `next` that were not in `prev`. */
export function newMentions(prev: string[], next: string[]): string[] {
  const prevSet = new Set(prev);
  return next.filter((h) => !prevSet.has(h));
}

export function handleFromName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? name;
  return first.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

/** Highlight @mentions for display. */
export function splitMentionParts(text: string): Array<
  { type: "text"; value: string } | { type: "mention"; value: string }
> {
  const parts: Array<
    { type: "text"; value: string } | { type: "mention"; value: string }
  > = [];
  const re = /@([a-zA-Z][a-zA-Z0-9_]{0,39})/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", value: text.slice(last, m.index) });
    }
    parts.push({ type: "mention", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts.length ? parts : [{ type: "text", value: text }];
}
