import fs from 'node:fs';
import path from 'node:path';
import type { DB, Lead, Activity, Task } from './types';

const dbPath = path.join(process.cwd(), 'data', 'db.json');
function read(): DB { return JSON.parse(fs.readFileSync(dbPath, 'utf8')) as DB; }
function write(db: DB) { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n', 'utf8'); }
export function listLeads(): Lead[] { return read().leads; }
export function getLead(id: string): Lead | undefined { return read().leads.find(l => l.id === id); }
export function updateLead(id: string, updater: (lead: Lead) => void): Lead | undefined {
  const db = read(); const lead = db.leads.find(l => l.id === id); if (!lead) return undefined;
  updater(lead); write(db); return lead;
}
export function addActivity(id: string, activity: Omit<Activity,'createdAt'>): Lead | undefined {
  return updateLead(id, l => l.activities.push({...activity, createdAt: new Date().toISOString()}));
}
export function addTask(id: string, task: Omit<Task,'id'|'completed'>): Lead | undefined {
  return updateLead(id, l => l.tasks.push({...task, id: `task-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, completed:false}));
}
export function setTask(id: string, taskId: string, completed: boolean): Lead | undefined {
  return updateLead(id, l => { const t=l.tasks.find(x=>x.id===taskId); if(t) t.completed=completed; });
}
export function setStage(id: string, stage: string): Lead | undefined { return updateLead(id, l => { l.deal.stage=stage; }); }
