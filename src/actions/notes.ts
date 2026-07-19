"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, type ActionResult } from "@/lib/safe-action";
import { resolvePropertyId } from "@/lib/property-context";
import { noteSchema, type NoteInput } from "@/schemas";
import {
  handlesFromNote,
  notifyMentionedOnNote,
} from "@/lib/mention-notify";
import { newMentions, type MentionNotifyResult } from "@/lib/mentions";

function revalidateNotes() {
  revalidatePath("/notes");
}

export type NoteActionData = {
  id: string;
  mentions?: MentionNotifyResult;
};

export async function createNote(
  input: NoteInput
): Promise<ActionResult<NoteActionData>> {
  try {
    const session = await requireAuth();
    const parsed = noteSchema.parse(input);
    const propertyId = await resolvePropertyId(parsed.propertyId);

    const note = await prisma.note.create({
      data: {
        propertyId,
        title: parsed.title.trim(),
        body: parsed.body.trim(),
        pinned: parsed.pinned,
        color: parsed.color,
      },
    });

    const handles = handlesFromNote(note.title, note.body);
    let mentions: MentionNotifyResult | undefined;
    if (handles.length) {
      mentions = await notifyMentionedOnNote({
        handles,
        noteTitle: note.title,
        noteBody: note.body,
        propertyId,
        authorName: session.user?.name || session.user?.email,
      });
    }

    revalidateNotes();
    return { success: true, data: { id: note.id, mentions } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create note",
    };
  }
}

export async function updateNote(
  id: string,
  input: NoteInput
): Promise<ActionResult<NoteActionData>> {
  try {
    const session = await requireAuth();
    const parsed = noteSchema.parse(input);
    const propertyId = await resolvePropertyId(parsed.propertyId);
    const existing = await prisma.note.findUniqueOrThrow({ where: { id } });

    const note = await prisma.note.update({
      where: { id },
      data: {
        propertyId,
        title: parsed.title.trim(),
        body: parsed.body.trim(),
        pinned: parsed.pinned,
        color: parsed.color,
      },
    });

    const prevHandles = handlesFromNote(existing.title, existing.body);
    const nextHandles = handlesFromNote(note.title, note.body);
    const added = newMentions(prevHandles, nextHandles);

    let mentions: MentionNotifyResult | undefined;
    if (added.length) {
      mentions = await notifyMentionedOnNote({
        handles: added,
        noteTitle: note.title,
        noteBody: note.body,
        propertyId,
        authorName: session.user?.name || session.user?.email,
      });
    }

    revalidateNotes();
    return { success: true, data: { id: note.id, mentions } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update note",
    };
  }
}

export async function toggleNotePinned(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const existing = await prisma.note.findUniqueOrThrow({ where: { id } });
    const note = await prisma.note.update({
      where: { id },
      data: { pinned: !existing.pinned },
    });
    revalidateNotes();
    return { success: true, data: note };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to pin note",
    };
  }
}

export async function deleteNote(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await prisma.note.delete({ where: { id } });
    revalidateNotes();
    return { success: true, data: null };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete note",
    };
  }
}
