import { NextResponse } from 'next/server'; import { listLeads } from '@/lib/repository'; import { risk } from '@/lib/intelligence';
function search(q:string){const leads=listLeads();const s=q.toLowerCase();let r=leads;
const amount=s.match(/(?:above|over|greater than)\s*\$?([\d,]+)/); if(amount){const n=Number(amount[1].replace(/,/g,''));r=r.filter(l=>l.deal.value>n)}
if(/open|active/.test(s))r=r.filter(l=>!['Won','Lost'].includes(l.deal.stage));
if(/risk|attention|stale|inactive/.test(s))r=r.filter(l=>risk(l).score>=30);
const stage=['new','qualified','proposal','negotiation','won','lost'].find(x=>s.includes(x));if(stage)r=r.filter(l=>l.deal.stage.toLowerCase()===stage);
if(/follow.?up|task/.test(s))r=r.filter(l=>l.tasks.some(t=>!t.completed));
if(r===leads)r=leads.filter(l=>`${l.name} ${l.company} ${l.title} ${l.deal.name}`.toLowerCase().includes(s));
return r.map(l=>({...l,health:risk(l)}));}
export async function GET(req:Request){const q=new URL(req.url).searchParams.get('q')?.trim()||'';return NextResponse.json({query:q,results:q?search(q):[]})}
