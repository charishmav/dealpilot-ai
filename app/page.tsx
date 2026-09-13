'use client';
import {useEffect,useMemo,useState} from 'react';

type Lead={id:string;name:string;title:string;company:string;email:string;phone:string;source:string;deal:{name:string;value:number;stage:string};notes:string[];activities:{type:string;title:string;description:string;createdAt:string}[];tasks:{id:string;title:string;dueDate:string;completed:boolean}[]};
type Summary = {
  who: string;
  important: string;
  happened: string[];
  missing: string[];
  risk?: {
    score: number;
    level: string;
    reasons: string[];
  };
  nextAction?: string;
  source: string;
};
type Insight={score:number;level:string;reasons:string[];lead:Lead};
const stages=['New','Qualified','Proposal','Negotiation','Won','Lost'];
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const initials=(n:string)=>n.split(' ').map(x=>x[0]).join('').slice(0,2);
const fmt=(x:string)=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(x));
const tone=(level:string)=>level==='High'?'danger':level==='Watch'?'warn':'good';

export default function Home(){
 const [leads,setLeads]=useState<Lead[]>([]),[selectedId,setSelectedId]=useState('lead-1'),[q,setQ]=useState(''),[tab,setTab]=useState('overview'),[summary,setSummary]=useState<Summary|null>(null),[insights,setInsights]=useState<any>(null),[searchResults,setSearchResults]=useState<Lead[]|null>(null),[loading,setLoading]=useState(false),[modal,setModal]=useState<'activity'|'task'|'draft'|null>(null),[toast,setToast]=useState(''),[draft,setDraft]=useState<{subject:string;body:string}|null>(null);
 const [activity,setActivity]=useState({type:'Call',title:'',description:''}),[task,setTask]=useState({title:'',dueDate:''});
 const load=async()=>{const r=await fetch('/api/leads',{cache:'no-store'});if(r.ok)setLeads(await r.json());const i=await fetch('/api/insights',{cache:'no-store'});if(i.ok)setInsights(await i.json())};
 useEffect(()=>{load()},[]);
 const selected=leads.find(x=>x.id===selectedId)||leads[0];
 const filtered=useMemo(()=>searchResults??leads.filter(l=>`${l.name} ${l.company} ${l.title} ${l.deal.name}`.toLowerCase().includes(q.toLowerCase())),[leads,q,searchResults]);
 const replace=(l:Lead)=>{setLeads(x=>x.map(a=>a.id===l.id?l:a));setSelectedId(l.id);setSummary(null);load();};
 async function smartSearch(v:string){setQ(v);if(!v.trim()){setSearchResults(null);return}const r=await fetch('/api/search?q='+encodeURIComponent(v));if(r.ok){const d=await r.json();setSearchResults(d.results)}}
 async function act(e:React.FormEvent){e.preventDefault();if(!selected)return;if(!activity.title.trim())return setToast('Activity title is required');const r=await fetch(`/api/leads/${selected.id}/activities`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(activity)});if(r.ok){replace(await r.json());setActivity({type:'Call',title:'',description:''});setModal(null);setToast('Activity saved')}}
 async function addTask(e:React.FormEvent){e.preventDefault();if(!selected)return;if(!task.title.trim()||!task.dueDate)return setToast('Task title and due date are required');const r=await fetch(`/api/leads/${selected.id}/tasks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(task)});if(r.ok){replace(await r.json());setTask({title:'',dueDate:''});setModal(null);setToast('Follow-up created')}}
 async function move(stage:string){if(!selected)return;const r=await fetch(`/api/leads/${selected.id}/deal`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({stage})});if(r.ok){replace(await r.json());setToast(`Deal moved to ${stage}`)}}
 async function done(id:string,v:boolean){if(!selected)return;const r=await fetch(`/api/leads/${selected.id}/tasks`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId:id,completed:v})});if(r.ok)replace(await r.json())}
 async function ai(){if(!selected)return;setLoading(true);const r=await fetch(`/api/leads/${selected.id}/summary`,{method:'POST'});if(r.ok)setSummary(await r.json());setLoading(false)}
 async function makeDraft(){if(!selected)return;setLoading(true);const r=await fetch(`/api/leads/${selected.id}/draft`,{method:'POST'});if(r.ok){setDraft(await r.json());setModal('draft')}setLoading(false)}
 if(!selected)return <div className="loading">Loading workspace…</div>;
 return <main className="app">
  <aside><div className="brand"><div className="brandmark">D</div><div><strong>DealPilot</strong><small>sales intelligence</small></div></div><small className="label">WORKSPACE</small>
   {[['overview','◈','Overview'],['leads','▦','Leads'],['pipeline','◇','Pipeline'],['intelligence','✦','AI insights']].map(([id,icon,name])=><button key={id} className={tab===id?'nav active':'nav'} onClick={()=>setTab(id)}><span>{icon}</span><b>{name}</b>{id==='leads'&&<em>{leads.length}</em>}</button>)}
   <div className="local"><span>●</span><div><strong>Local-first</strong><small>No cloud services required</small></div></div><div className="user"><b>CA</b><span><strong>Sales workspace</strong><small>Local demo data</small></span></div>
  </aside>
  <section className="main"><header><div><small>AI SALES INTELLIGENCE</small><h1>{tab==='overview'?'Overview':tab==='leads'?'Leads':tab==='pipeline'?'Deal pipeline':'AI insights'}</h1></div><div className="top"><span>● Local data</span><button onClick={load}>↻ Refresh</button></div></header>
  {tab==='overview'&&<Overview insights={insights} onTab={setTab} onSelect={(id:string)=>{setSelectedId(id);setTab('leads')}}/>}
  {tab==='pipeline'&&<div className="pipeline">{stages.map(s=><div className="column" key={s}><h3>{s}<i>{leads.filter(l=>l.deal.stage===s).length}</i></h3>{leads.filter(l=>l.deal.stage===s).map(l=><button className="deal" key={l.id} onClick={()=>{setSelectedId(l.id);setTab('leads')}}><b>{initials(l.name)}</b><span><strong>{l.name}</strong><small>{l.company}</small><small>{money(l.deal.value)}</small></span></button>)}</div>)}</div>}
  {tab==='intelligence'&&<Intelligence insights={insights} onSelect={(id:string)=>{setSelectedId(id);setTab('leads')}}/>}
  {tab==='leads'&&<div className="workspace"><div className="list"><div className="search"><span>⌕</span><input value={q} onChange={e=>smartSearch(e.target.value)} placeholder="Ask or search: open deals over $40,000 needing attention…"/></div><div className="hint">Try: <button onClick={()=>smartSearch('open deals over $40000')}>open deals over $40k</button><button onClick={()=>smartSearch('deals needing attention')}>deals needing attention</button></div><div className="meta">{filtered.length} leads <span>{searchResults?'Smart query results':'Search by name, company or deal'}</span></div>{filtered.map(l=><button className={l.id===selected.id?'lead selected':'lead'} key={l.id} onClick={()=>{setSelectedId(l.id);setSummary(null)}}><b>{initials(l.name)}</b><span><strong>{l.name}</strong><small>{l.title} · {l.company}</small><small>{money(l.deal.value)} · {l.deal.stage}</small></span><i>›</i></button>)}</div>
   <div className="detail"><div className="profile"><div className="person"><b>{initials(selected.name)}</b><span><strong>{selected.name}</strong><small>{selected.title} · {selected.company}</small><small>{selected.email} · {selected.phone}</small></span></div><div><button onClick={()=>setModal('activity')}>＋ Activity</button><button onClick={makeDraft}>✦ Draft follow-up</button><button className="primary" onClick={()=>setModal('task')}>＋ Follow-up</button></div></div>
    <div className="stats"><div><small>DEAL VALUE</small><strong>{money(selected.deal.value)}</strong><span>{selected.deal.name}</span></div><div><small>DEAL HEALTH</small><strong className={tone(insights?.risks?.find((x:Insight)=>x.lead.id===selected.id)?.level||'Healthy')}>{insights?.risks?.find((x:Insight)=>x.lead.id===selected.id)?.level||'Healthy'}</strong><span>Explainable CRM signals</span></div><div><small>STAGE</small><strong>{selected.deal.stage}</strong><span>{selected.activities.length} activities</span></div></div>
    <section className="card"><div className="cardhead"><div><small>PIPELINE</small><h2>Move deal</h2></div></div><div className="stages">{stages.map((s,i)=><button className={s===selected.deal.stage?'current':''} onClick={()=>move(s)} key={s}><b>{i+1}</b>{s}</button>)}</div></section>
    <div className="twocol"><section className="card"><div className="cardhead"><div><small>RELATIONSHIP</small><h2>Activity history</h2></div><button onClick={()=>setModal('activity')}>＋</button></div><div className="timeline">{[...selected.activities].reverse().map((a,i)=><div className="event" key={i}><b></b><span><strong>{a.title}</strong><small>{fmt(a.createdAt)} · {a.type}</small><p>{a.description}</p></span></div>)}</div></section>
     <section className="card"><div className="cardhead"><div><small>NEXT ACTIONS</small><h2>Follow-up tasks</h2></div><button onClick={()=>setModal('task')}>＋</button></div><div className="tasks">{selected.tasks.map(t=><label key={t.id}><input type="checkbox" checked={t.completed} onChange={e=>done(t.id,e.target.checked)}/><span><strong>{t.title}</strong><small>Due {fmt(t.dueDate+'T12:00:00')}</small></span></label>)}{!selected.tasks.length&&<p className="empty">No follow-up tasks yet.</p>}</div></section></div>

    <section className="ai">
  <div className="aihead">
    <b>✦</b>

    <div>
      <small>GROUNDED COPILOT</small>
      <h2>Account brief</h2>
      <p>
        Uses only CRM context. Local deterministic mode works without any AI service.
      </p>
    </div>

    <button
      className="primary"
      disabled={loading}
      onClick={ai}
    >
      {loading ? 'Working…' : summary ? 'Regenerate' : 'Generate brief'}
    </button>
  </div>

  {!summary ? (
    <div className="aiprompt">
      <span>✦</span>

      <div>
        <strong>Understand this account in seconds</strong>
        <small>
          Who they are, what matters, what happened and what information is missing.
        </small>
      </div>
    </div>
  ) : (
    <div className="result">
      <label>
        {summary.source === 'ollama-local'
          ? 'LOCAL MODEL'
          : 'LOCAL GROUNDED ANALYSIS'}
      </label>

      <div>
        <article>
          <small>WHO</small>
          <p>{summary.who}</p>
        </article>

        <article>
          <small>WHAT MATTERS</small>
          <p>{summary.important}</p>
        </article>

        <article>
          <small>WHAT HAPPENED</small>
          <ul>
            {summary.happened.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </article>

        <article>
          <small>WHAT'S MISSING</small>
          <ul>
            {summary.missing.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </article>

        <article>
          <small>DEAL RISK</small>

          <p>
            <strong>
              {summary.risk?.score ?? 0} ·{' '}
              {summary.risk?.level ?? 'Healthy'}
            </strong>
          </p>

          {summary.risk?.reasons?.length ? (
            <ul>
              {summary.risk.reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p>No active risk signals.</p>
          )}
        </article>

        <article>
          <small>NEXT BEST ACTION</small>
          <p>
            {summary.nextAction ||
              'Review the account and choose the next customer-facing action.'}
          </p>
        </article>
      </div>
    </div>
  )}
</section>
    <div className="notes"><span><small>REP NOTE</small>{selected.notes[0]||'No notes recorded yet.'}</span><code>Lead → Deal → Activities → Tasks → Intelligence</code></div>
   </div></div>}
  </section>
  {modal&&<div className="overlay" onMouseDown={()=>setModal(null)}><form className="modal" onSubmit={modal==='activity'?act:modal==='task'?addTask:e=>e.preventDefault()} onMouseDown={e=>e.stopPropagation()}><button type="button" className="x" onClick={()=>setModal(null)}>×</button>{modal==='draft'?<><small>AI-ASSISTED DRAFT</small><h2>Follow-up email</h2><label>Subject<input value={draft?.subject||''} readOnly/></label><label>Message<textarea value={draft?.body||''} onChange={e=>setDraft(d=>d?{...d,body:e.target.value}:d)} rows={10}/></label><div className="modalbuttons">
    <button
  type="button"
  onClick={async () => {
    if (!draft) return;

    const text = `${draft.subject}\n\n${draft.body}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }

      setToast('Draft copied to clipboard');
    } catch {
      setToast('Copy failed — please copy manually');
    }
  }}
>
  Copy draft
</button>



    <button className="primary" type="button" onClick={()=>{setModal(null);setToast('Draft ready for review')}}>Done</button></div></>:<><small>{modal==='activity'?'LEAD HISTORY':'NEXT ACTION'}</small><h2>{modal==='activity'?'Add activity':'Create follow-up'}</h2>{modal==='activity'?<><label>Type<select value={activity.type} onChange={e=>setActivity({...activity,type:e.target.value})}><option>Call</option><option>Email</option><option>Meeting</option><option>Demo</option><option>Note</option></select></label><label>Title<input autoFocus value={activity.title} onChange={e=>setActivity({...activity,title:e.target.value})} placeholder="Pricing discussion"/></label><label>Details<textarea value={activity.description} onChange={e=>setActivity({...activity,description:e.target.value})} rows={4} placeholder="What happened?"/></label></>:<><label>Task title<input autoFocus value={task.title} onChange={e=>setTask({...task,title:e.target.value})} placeholder="Call customer about proposal"/></label><label>Due date<input type="date" value={task.dueDate} onChange={e=>setTask({...task,dueDate:e.target.value})}/></label></>}<div className="modalbuttons"><button type="button" onClick={()=>setModal(null)}>Cancel</button><button className="primary">{modal==='activity'?'Save activity':'Create task'}</button></div></>}</form></div>}
  {toast&&<button className="toast" onClick={()=>setToast('')}>{toast} ×</button>}
 </main>
}
function Overview({
  insights,
  onTab,
  onSelect,
}: {
  insights: any;
  onTab: (x: string) => void;
  onSelect: (id: string) => void;
}) {
  if (!insights) {
    return <div className="emptyview">Loading intelligence…</div>;
  }

  const maxStageCount = Math.max(
    1,
    ...Object.values(insights.stageCounts || {}).map(Number)
  );

  return (
    <div className="overview">
      <div className="hero">
        <div>
          <small>LOCAL-FIRST SALES OPERATING SYSTEM</small>
          <h2>Turn CRM records into the next best action.</h2>
          <p>
            DealPilot combines structured CRM data, explainable deal health
            and grounded AI workflows without requiring a cloud account.
          </p>
        </div>

        <button
          className="primary"
          onClick={() => onTab('intelligence')}
        >
          View AI insights →
        </button>
      </div>

      <div className="metricgrid">
        <Metric
          label="Open pipeline"
          value={money(insights.pipeline)}
        />

        <Metric
          label="Won revenue"
          value={money(insights.won)}
        />

        <Metric
          label="Active deals"
          value={String(insights.openCount)}
        />

        <Metric
          label="High-risk value"
          value={money(insights.highRiskValue || 0)}
          danger
        />
      </div>

      <div className="metricgrid secondary">
        <Metric
          label="Deals needing attention"
          value={String(insights.attentionCount || 0)}
        />

        <Metric
          label="Win rate"
          value={`${insights.winRate || 0}%`}
        />

        <Metric
          label="Healthy pipeline"
          value={money(insights.healthyValue || 0)}
        />

        <Metric
          label="Overdue follow-ups"
          value={String(insights.overdue?.length || 0)}
          danger={Boolean(insights.overdue?.length)}
        />
      </div>

      <div className="dashgrid">
        <section className="card">
          <div className="cardhead">
            <div>
              <small>ATTENTION QUEUE</small>
              <h2>Deals needing attention</h2>
            </div>

            <button onClick={() => onTab('intelligence')}>
              View all
            </button>
          </div>

          {insights.risks?.slice(0, 5).map((x: any) => (
            <button
              className="queue"
              key={x.lead.id}
              onClick={() => onSelect(x.lead.id)}
            >
              <span className={`badge ${tone(x.level)}`}>
                {x.score}
              </span>

              <span>
                <strong>{x.lead.company}</strong>

                <small>
                  {x.lead.name} · {x.lead.deal.stage}
                </small>

                <small>
                  {x.reasons?.[0] || 'Review account activity'}
                </small>
              </span>

              <em>{x.level}</em>
            </button>
          ))}

          {!insights.risks?.length && (
            <div className="emptyview">
              No active risk signals.
            </div>
          )}
        </section>

        <section className="card">
          <div className="cardhead">
            <div>
              <small>PIPELINE MIX</small>
              <h2>Opportunities by stage</h2>
            </div>
          </div>

          <div className="bars">
            {stages.map((stage) => {
              const count = Number(
                insights.stageCounts?.[stage] || 0
              );

              return (
                <div key={stage}>
                  <span>{stage}</span>

                  <b
                    style={{
                      width: `${Math.max(
                        4,
                        (count / maxStageCount) * 100
                      )}%`,
                    }}
                  />

                  <i>{count}</i>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="card insight-strip">
        <div>
          <small>DECISION SIGNAL</small>
          <h2>Where should the team focus?</h2>
        </div>

        <div className="signal-grid">
          <div>
            <strong>{insights.highRisk || 0}</strong>
            <span>high-risk deals</span>
          </div>

          <div>
            <strong>
              {money(insights.highRiskValue || 0)}
            </strong>
            <span>revenue exposed</span>
          </div>

          <div>
            <strong>{insights.overdue?.length || 0}</strong>
            <span>overdue actions</span>
          </div>

          <div>
            <strong>{insights.winRate || 0}%</strong>
            <span>closed-deal win rate</span>
          </div>
        </div>
      </section>
    </div>
  );
}
function Metric({label,value,danger}:{label:string;value:string;danger?:boolean}){return <div className="metric"><small>{label}</small><strong className={danger?'danger':''}>{value}</strong><span>From local CRM records</span></div>}
function Intelligence({insights,onSelect}:{insights:any;onSelect:(id:string)=>void}){if(!insights)return <div className="emptyview">Loading intelligence…</div>;return <div className="intelligence"><div className="hero compact"><div><small>EXPLAINABLE SCORING</small><h2>AI attention, backed by CRM signals.</h2><p>No opaque lead score. Each risk level is derived from activity freshness, overdue tasks, notes and deal context.</p></div></div>{insights.risks.map((x:Insight)=><button className="riskrow" key={x.lead.id} onClick={()=>onSelect(x.lead.id)}><span className={'risknum '+tone(x.level)}>{x.score}</span><span className="riskmain"><strong>{x.lead.company}</strong><small>{x.lead.name} · {money(x.lead.deal.value)} · {x.lead.deal.stage}</small><p>{x.reasons.length?x.reasons.join(' · '):'No risk signals.'}</p></span><em>{x.level}</em><b>→</b></button>)}{!insights.risks.length&&<div className="emptyview">No active risk signals.</div>}</div>}
