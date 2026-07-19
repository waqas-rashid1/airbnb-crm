"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, isToday, isTomorrow, parseISO, startOfDay } from "date-fns";
import {
  AtSign,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  Pencil,
  Pin,
  PinOff,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createTask,
  deleteTask,
  setTaskStatus,
  updateTask,
} from "@/actions/tasks";
import {
  createNote,
  deleteNote,
  toggleNotePinned,
  updateNote,
} from "@/actions/notes";
import type { NoteInput, TaskInput } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import {
  splitMentionParts,
  type MentionNotifyResult,
  type MentionTarget,
} from "@/lib/mentions";

function MentionText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {splitMentionParts(text).map((part, i) =>
        part.type === "mention" ? (
          <span
            key={i}
            className="rounded bg-teal-500/15 px-1 py-0.5 font-medium text-teal-800 dark:text-teal-300"
          >
            {part.value}
          </span>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </span>
  );
}

function toastMentions(mentions?: MentionNotifyResult) {
  if (!mentions) return;
  if (mentions.emailed.length) {
    toast.success(`Emailed ${mentions.emailed.join(" · ")}`);
  }
  if (mentions.skipped.length && !mentions.emailed.length) {
    toast.message(
      mentions.mailConfigured
        ? `No email for @${mentions.skipped.join(", @")} — set it on Owners or MENTION_EMAIL_*`
        : "Note saved. Add RESEND_API_KEY or SMTP_* to enable @mention emails."
    );
  } else if (mentions.errors.length && mentions.emailed.length) {
    toast.message(mentions.errors[0]);
  }
}

export type TaskRow = {
  id: string;
  propertyId: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type NoteRow = {
  id: string;
  propertyId: string;
  title: string;
  body: string;
  pinned: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
};

type PropertyOption = {
  id: string;
  name: string;
  buildingName?: string | null;
  roomNumber?: string | null;
};

type NotesTasksViewProps = {
  tasks: TaskRow[];
  notes: NoteRow[];
  properties: PropertyOption[];
  selectedPropertyId: string;
  mentionTargets: MentionTarget[];
};

const PRIORITY_STYLES = {
  HIGH: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900",
  MEDIUM:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  LOW: "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-800",
} as const;

const NOTE_COLORS: Record<string, string> = {
  default: "border-border bg-card",
  teal: "border-teal-200/80 bg-teal-50/70 dark:border-teal-900 dark:bg-teal-950/30",
  amber: "border-amber-200/80 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30",
  rose: "border-rose-200/80 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/30",
  sky: "border-sky-200/80 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/30",
};

function dueLabel(dueDate: string | null) {
  if (!dueDate) return null;
  const d = parseISO(dueDate);
  if (isToday(d)) return { text: "Today", tone: "warn" as const };
  if (isTomorrow(d)) return { text: "Tomorrow", tone: "ok" as const };
  if (isPast(startOfDay(d))) return { text: "Overdue", tone: "bad" as const };
  return { text: format(d, "MMM d"), tone: "ok" as const };
}

export function NotesTasksView({
  tasks,
  notes,
  properties,
  selectedPropertyId,
  mentionTargets,
}: NotesTasksViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState("tasks");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskRow["status"]>(
    "ALL"
  );
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] =
    useState<TaskInput["priority"]>("MEDIUM");

  const [taskDialog, setTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [taskForm, setTaskForm] = useState<TaskInput>({
    propertyId: selectedPropertyId,
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
  });

  const [noteDialog, setNoteDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteRow | null>(null);
  const [noteForm, setNoteForm] = useState<NoteInput>({
    propertyId: selectedPropertyId,
    title: "",
    body: "",
    pinned: false,
    color: "default",
  });

  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const openCounts = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "DONE");
    return {
      open: open.length,
      high: open.filter((t) => t.priority === "HIGH").length,
      overdue: open.filter((t) => {
        if (!t.dueDate) return false;
        return isPast(startOfDay(parseISO(t.dueDate))) && !isToday(parseISO(t.dueDate));
      }).length,
      notes: notes.length,
      pinned: notes.filter((n) => n.pinned).length,
    };
  }, [tasks, notes]);

  const filteredTasks = useMemo(() => {
    const list =
      statusFilter === "ALL"
        ? tasks
        : tasks.filter((t) => t.status === statusFilter);
    return [...list].sort((a, b) => {
      const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      if (a.status === "DONE" !== (b.status === "DONE")) {
        return a.status === "DONE" ? 1 : -1;
      }
      if (rank[a.priority] !== rank[b.priority]) {
        return rank[a.priority] - rank[b.priority];
      }
      const ad = a.dueDate ? parseISO(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? parseISO(b.dueDate).getTime() : Infinity;
      return ad - bd;
    });
  }, [tasks, statusFilter]);

  const sortedNotes = useMemo(
    () =>
      [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return parseISO(b.updatedAt).getTime() - parseISO(a.updatedAt).getTime();
      }),
    [notes]
  );

  function refresh() {
    router.refresh();
  }

  function openNewTask() {
    setEditingTask(null);
    setTaskForm({
      propertyId: selectedPropertyId,
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
    });
    setTaskDialog(true);
  }

  function openEditTask(task: TaskRow) {
    setEditingTask(task);
    setTaskForm({
      propertyId: task.propertyId,
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setTaskDialog(true);
  }

  function openNewNote() {
    setEditingNote(null);
    setNoteForm({
      propertyId: selectedPropertyId,
      title: "",
      body: "",
      pinned: false,
      color: "default",
    });
    setNoteDialog(true);
  }

  function openEditNote(note: NoteRow) {
    setEditingNote(note);
    setNoteForm({
      propertyId: note.propertyId,
      title: note.title,
      body: note.body,
      pinned: note.pinned,
      color: (note.color as NoteInput["color"]) || "default",
    });
    setNoteDialog(true);
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    startTransition(async () => {
      const res = await createTask({
        propertyId: selectedPropertyId,
        title,
        description: "",
        status: "TODO",
        priority: quickPriority,
        dueDate: "",
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setQuickTitle("");
      toast.success("Task added");
      refresh();
    });
  }

  async function handleSaveTask() {
    startTransition(async () => {
      const payload: TaskInput = {
        ...taskForm,
        title: taskForm.title.trim(),
        description: taskForm.description || "",
        dueDate: taskForm.dueDate || "",
      };
      const res = editingTask
        ? await updateTask(editingTask.id, payload)
        : await createTask(payload);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(editingTask ? "Task updated" : "Task created");
      setTaskDialog(false);
      refresh();
    });
  }

  async function handleSaveNote() {
    startTransition(async () => {
      const payload: NoteInput = {
        ...noteForm,
        title: noteForm.title.trim(),
        body: noteForm.body.trim(),
      };
      const res = editingNote
        ? await updateNote(editingNote.id, payload)
        : await createNote(payload);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(editingNote ? "Note updated" : "Note saved");
      toastMentions(res.data?.mentions);
      setNoteDialog(false);
      refresh();
    });
  }

  function insertMention(handle: string) {
    const tag = `@${handle}`;
    setNoteForm((f) => {
      const body = f.body?.trim() ? `${f.body.trim()} ${tag}` : tag;
      return { ...f, body };
    });
  }

  async function toggleDone(task: TaskRow) {
    const next = task.status === "DONE" ? "TODO" : "DONE";
    startTransition(async () => {
      const res = await setTaskStatus(task.id, next);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      refresh();
    });
  }

  async function cycleStatus(task: TaskRow) {
    const order: TaskRow["status"][] = ["TODO", "IN_PROGRESS", "DONE"];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    startTransition(async () => {
      const res = await setTaskStatus(task.id, next);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Open tasks", value: openCounts.open },
          { label: "High priority", value: openCounts.high },
          { label: "Overdue", value: openCounts.overdue },
          { label: "Notes", value: openCounts.notes },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border/80 bg-card px-3.5 py-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="tasks" className="gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5">
              <StickyNote className="h-3.5 w-3.5" />
              Notes
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {tab === "tasks" ? (
              <Button size="sm" onClick={openNewTask}>
                <Plus className="mr-1.5 h-4 w-4" />
                New task
              </Button>
            ) : (
              <Button size="sm" onClick={openNewNote}>
                <Plus className="mr-1.5 h-4 w-4" />
                New note
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="tasks" className="mt-0 space-y-4">
          {/* Taskbar — quick capture */}
          <form
            onSubmit={handleQuickAdd}
            className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/40 p-2 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-background px-3 ring-1 ring-border">
              <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Quick add a task… (Enter to save)"
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <Select
              value={quickPriority}
              onValueChange={(v) =>
                setQuickPriority(v as TaskInput["priority"])
              }
            >
              <SelectTrigger className="h-10 w-full bg-background sm:w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="h-10 sm:w-[100px]"
              disabled={pending || !quickTitle.trim()}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["ALL", "All"],
                ["TODO", "To do"],
                ["IN_PROGRESS", "In progress"],
                ["DONE", "Done"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors",
                  statusFilter === value
                    ? "bg-[hsl(var(--brand))] text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                <span className="ml-1.5 tabular-nums opacity-70">
                  {value === "ALL"
                    ? tasks.length
                    : tasks.filter((t) => t.status === value).length}
                </span>
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Use the bar above to capture cleaning, maintenance, or guest follow-ups in seconds."
            />
          ) : (
            <ul className="divide-y divide-border/80 overflow-hidden rounded-xl border border-border/80 bg-card">
              {filteredTasks.map((task) => {
                const due = dueLabel(task.dueDate);
                const done = task.status === "DONE";
                return (
                  <li
                    key={task.id}
                    className={cn(
                      "group flex items-start gap-3 px-3.5 py-3 transition-colors hover:bg-muted/40",
                      done && "opacity-60"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDone(task)}
                      className="mt-0.5 shrink-0 text-[hsl(var(--brand))]"
                      aria-label={done ? "Mark incomplete" : "Mark done"}
                    >
                      {done ? (
                        <CheckCircle2 className="h-[18px] w-[18px]" />
                      ) : (
                        <Circle className="h-[18px] w-[18px] text-muted-foreground/70" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            "text-[14px] font-medium leading-snug",
                            done && "line-through"
                          )}
                        >
                          {task.title}
                        </p>
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                            PRIORITY_STYLES[task.priority]
                          )}
                        >
                          {task.priority}
                        </span>
                        {due ? (
                          <span
                            className={cn(
                              "text-[11.5px] font-medium",
                              due.tone === "bad" && "text-rose-600",
                              due.tone === "warn" && "text-amber-700",
                              due.tone === "ok" && "text-muted-foreground"
                            )}
                          >
                            {due.text}
                          </span>
                        ) : null}
                      </div>
                      {task.description ? (
                        <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
                          {task.description}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cycleStatus(task)}
                          className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                        >
                          {task.status === "TODO"
                            ? "To do"
                            : task.status === "IN_PROGRESS"
                              ? "In progress"
                              : "Done"}
                          <span className="ml-1 opacity-50">↻</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditTask(task)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600"
                        onClick={() => setDeleteTaskId(task.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-0 space-y-4">
          <div className="flex flex-wrap items-start gap-2 rounded-xl border border-dashed border-teal-200/80 bg-teal-50/50 px-3.5 py-3 text-[13px] text-teal-900 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-100">
            <AtSign className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
            <p className="min-w-0 flex-1 leading-relaxed">
              Tag someone to email them the note — try{" "}
              <span className="font-semibold">@waqas</span> or{" "}
              <span className="font-semibold">@naseeb</span>. Emails come from
              the Owners page (or <code className="text-[12px]">MENTION_EMAIL_*</code>{" "}
              env).
            </p>
          </div>
          {sortedNotes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              description="Park landlord reminders, Wi‑Fi codes, and ops details here — pin important ones, and @tag partners to email them."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sortedNotes.map((note) => (
                <article
                  key={note.id}
                  className={cn(
                    "group relative flex min-h-[160px] flex-col rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md",
                    NOTE_COLORS[note.color] ?? NOTE_COLORS.default
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-[14.5px] font-semibold leading-snug tracking-tight">
                      <MentionText text={note.title} />
                    </h3>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await toggleNotePinned(note.id);
                            if (!res.success) toast.error(res.error);
                            else refresh();
                          })
                        }
                      >
                        {note.pinned ? (
                          <Pin className="h-3.5 w-3.5 text-[hsl(var(--brand))]" />
                        ) : (
                          <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
                    <MentionText text={note.body} />
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
                    <span className="text-[11px] text-muted-foreground">
                      {format(parseISO(note.updatedAt), "MMM d · HH:mm")}
                    </span>
                    <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditNote(note)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-600"
                        onClick={() => setDeleteNoteId(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Task dialog */}
      <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit task" : "New task"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Deep clean before Friday check-in"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Details</Label>
              <Textarea
                value={taskForm.description ?? ""}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="Optional notes…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(v) =>
                    setTaskForm((f) => ({
                      ...f,
                      status: v as TaskInput["status"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) =>
                    setTaskForm((f) => ({
                      ...f,
                      priority: v as TaskInput["priority"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={taskForm.dueDate ?? ""}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, dueDate: e.target.value }))
                }
              />
            </div>
            {properties.length > 1 ? (
              <div className="space-y-1.5">
                <Label>Property</Label>
                <Select
                  value={taskForm.propertyId}
                  onValueChange={(v) =>
                    setTaskForm((f) => ({ ...f, propertyId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.roomNumber
                          ? `Apt. ${p.roomNumber}${p.buildingName ? ` · ${p.buildingName}` : ""}`
                          : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTask}
              disabled={pending || !taskForm.title.trim()}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note dialog */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Edit note" : "New note"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={noteForm.title}
                onChange={(e) =>
                  setNoteForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Wi‑Fi & access codes"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea
                value={noteForm.body}
                onChange={(e) =>
                  setNoteForm((f) => ({ ...f, body: e.target.value }))
                }
                rows={6}
                placeholder="Write anything… tag @waqas or @naseeb to email them"
              />
              {mentionTargets.length ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    Notify:
                  </span>
                  {mentionTargets.map((t) => (
                    <button
                      key={t.handle}
                      type="button"
                      onClick={() => insertMention(t.handle)}
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset transition-colors",
                        t.hasEmail
                          ? "bg-teal-50 text-teal-800 ring-teal-200 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-200 dark:ring-teal-800"
                          : "bg-muted text-muted-foreground ring-border hover:bg-muted/80"
                      )}
                      title={
                        t.hasEmail
                          ? `Insert @${t.handle} (email ready)`
                          : `Insert @${t.handle} — set email on Owners first`
                      }
                    >
                      @{t.handle}
                      {!t.hasEmail ? " · no email" : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Color</Label>
                <Select
                  value={noteForm.color}
                  onValueChange={(v) =>
                    setNoteForm((f) => ({
                      ...f,
                      color: v as NoteInput["color"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="teal">Teal</SelectItem>
                    <SelectItem value="amber">Amber</SelectItem>
                    <SelectItem value="rose">Rose</SelectItem>
                    <SelectItem value="sky">Sky</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Checkbox
                  id="pin-note"
                  checked={noteForm.pinned}
                  onCheckedChange={(c) =>
                    setNoteForm((f) => ({ ...f, pinned: c === true }))
                  }
                />
                <Label htmlFor="pin-note" className="font-normal">
                  Pin to top
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={
                pending || !noteForm.title.trim() || !noteForm.body.trim()
              }
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteTaskId}
        onOpenChange={(o) => !o && setDeleteTaskId(null)}
        onConfirm={async () => {
          if (!deleteTaskId) return;
          const res = await deleteTask(deleteTaskId);
          if (!res.success) toast.error(res.error);
          else {
            toast.success("Task deleted");
            setDeleteTaskId(null);
            refresh();
          }
        }}
      />

      <ConfirmDelete
        open={!!deleteNoteId}
        onOpenChange={(o) => !o && setDeleteNoteId(null)}
        onConfirm={async () => {
          if (!deleteNoteId) return;
          const res = await deleteNote(deleteNoteId);
          if (!res.success) toast.error(res.error);
          else {
            toast.success("Note deleted");
            setDeleteNoteId(null);
            refresh();
          }
        }}
      />
    </div>
  );
}
