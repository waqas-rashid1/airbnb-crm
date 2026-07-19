import { prisma } from "@/lib/db";
import {
  getSelectedProperty,
  listProperties,
} from "@/lib/property-context";
import { PageHeader } from "@/components/shared/page-header";
import { NotesTasksView } from "@/components/notes/notes-tasks-view";
import { listMentionTargets } from "@/lib/mention-notify";
import { isMailConfigured } from "@/lib/mail";

export default async function NotesPage() {
  const [property, properties] = await Promise.all([
    getSelectedProperty(),
    listProperties(),
  ]);

  if (!property) {
    return <p className="text-muted-foreground">No property configured.</p>;
  }

  const [tasks, notes, mentionTargets] = await Promise.all([
    prisma.task.findMany({
      where: { propertyId: property.id },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
    }),
    prisma.note.findMany({
      where: { propertyId: property.id },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    }),
    listMentionTargets(property.id),
  ]);

  const mailReady = isMailConfigured();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes & Tasks"
        description={
          mailReady
            ? "Quick capture for ops to-dos. Tag @waqas or @naseeb in a note to email them."
            : "Quick capture for ops to-dos. Add RESEND_API_KEY or SMTP_* env vars to enable @mention emails."
        }
      />
      <NotesTasksView
        tasks={tasks.map((t) => ({
          id: t.id,
          propertyId: t.propertyId,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate?.toISOString() ?? null,
          completedAt: t.completedAt?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
        }))}
        notes={notes.map((n) => ({
          id: n.id,
          propertyId: n.propertyId,
          title: n.title,
          body: n.body,
          pinned: n.pinned,
          color: n.color,
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
        }))}
        properties={properties.map((p) => ({
          id: p.id,
          name: p.name,
          buildingName: p.buildingName,
          roomNumber: p.roomNumber,
        }))}
        selectedPropertyId={property.id}
        mentionTargets={mentionTargets}
      />
    </div>
  );
}
