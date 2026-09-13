export type Activity = { type: string; title: string; description: string; createdAt: string };
export type Task = { id: string; title: string; dueDate: string; completed: boolean };
export type Lead = {
  id: string; name: string; title: string; company: string; email: string; phone: string; source: string;
  deal: { name: string; value: number; stage: string };
  notes: string[]; activities: Activity[]; tasks: Task[];
};
export type DB = { leads: Lead[] };
