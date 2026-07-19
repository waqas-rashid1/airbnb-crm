import { prisma } from "@/lib/db";
import {
  getSelectedProperty,
  listProperties,
} from "@/lib/property-context";
import { PageHeader } from "@/components/shared/page-header";
import { NotesTasksView } from "@/components/notes/notes-tasks-view";

export default async function NotesPage() {
  const [property, properties] = await Promise.all([
    getSelectedProperty(),
    listProperties(),
  ]);

  if (!property) {
    return <p className="text-muted-foreground">No property configured.</p>;
  }

  const [tasks, notes] = await Promise.all([
    prisma.task.findMany({
      where: { propertyId: property.id },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
    }),
    prisma.note.findMany({
      where: { propertyId: property.id },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes & Tasks"
        description="Quick capture bar for ops to-dos, plus pinned notes for codes, reminders, and landlord details"
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
      />
    </div>
  );
}
