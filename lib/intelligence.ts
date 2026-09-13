import type { Lead } from './types';

const stages = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const;

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export function daysSince(iso: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  );
}

export function risk(lead: Lead) {
  if (['Won', 'Lost'].includes(lead.deal.stage)) {
    return {
      score: 0,
      level: 'Closed',
      reasons: [] as string[],
      signals: [] as string[],
      recommendation: 'No action required for a closed opportunity.',
    };
  }

  let score = 0;
  const reasons: string[] = [];
  const signals: string[] = [];

  const latest = [...lead.activities].sort(
    (a, b) =>
      +new Date(b.createdAt) - +new Date(a.createdAt)
  )[0];

  const activityAge = latest ? daysSince(latest.createdAt) : null;

  if (!latest) {
    score += 35;
    reasons.push('No recorded customer activity');
    signals.push('Activity history is empty');
  } else if (activityAge! >= 7) {
    score += 35;
    reasons.push(`${activityAge} days since the latest activity`);
    signals.push('Customer engagement is stale');
  } else if (activityAge! >= 4) {
    score += 18;
    reasons.push('Activity is starting to go stale');
    signals.push(`${activityAge} days since last activity`);
  }

  const overdue = lead.tasks.filter(
    (task) =>
      !task.completed &&
      new Date(task.dueDate + 'T23:59:59') < new Date()
  );

  if (overdue.length) {
    score += 30;
    reasons.push(
      `${overdue.length} follow-up task${overdue.length > 1 ? 's' : ''} overdue`
    );
    signals.push('Follow-up execution is behind schedule');
  }

  const openTasks = lead.tasks.filter((task) => !task.completed);

  if (!lead.notes.length) {
    score += 10;
    reasons.push('No rep note recorded');
    signals.push('Account context is incomplete');
  }

  if (
    lead.deal.stage === 'Proposal' &&
    lead.activities.length < 3
  ) {
    score += 15;
    reasons.push('Proposal stage has limited interaction history');
    signals.push('Proposal has weak engagement evidence');
  }

  if (
    lead.deal.stage === 'Negotiation' &&
    !lead.activities.some((activity) =>
      /price|pricing|contract|legal|approval|budget|negotiat/i.test(
        `${activity.title} ${activity.description}`
      )
    )
  ) {
    score += 15;
    reasons.push('Negotiation has no recorded commercial signal');
    signals.push('Commercial decision context is missing');
  }

  if (
    lead.deal.stage === 'Qualified' &&
    !lead.activities.some((activity) =>
      /requirement|need|problem|use case|decision|timeline/i.test(
        `${activity.title} ${activity.description}`
      )
    )
  ) {
    score += 10;
    reasons.push('Qualification evidence is limited');
    signals.push('Customer requirements are not clearly documented');
  }

  const capped = Math.min(score, 100);

  let level: 'High' | 'Watch' | 'Healthy';

  if (capped >= 60) {
    level = 'High';
  } else if (capped >= 30) {
    level = 'Watch';
  } else {
    level = 'Healthy';
  }

  let recommendation =
    'Continue monitoring activity and maintain a clear next step.';

  if (level === 'High') {
    recommendation =
      'Take a customer-facing action today and document the outcome.';
  } else if (level === 'Watch') {
    recommendation =
      'Schedule the next customer-facing action before engagement becomes stale.';
  }

  if (overdue.length) {
    recommendation =
      'Resolve the overdue follow-up and record the customer response.';
  }

  return {
    score: capped,
    level,
    reasons,
    signals,
    recommendation,
    activityAge,
    overdueTasks: overdue.length,
    openTasks: openTasks.length,
  };
}

export function insights(leads: Lead[]) {
  const open = leads.filter(
    (lead) => !['Won', 'Lost'].includes(lead.deal.stage)
  );

  const pipeline = open.reduce(
    (sum, lead) => sum + lead.deal.value,
    0
  );

  const won = leads
    .filter((lead) => lead.deal.stage === 'Won')
    .reduce((sum, lead) => sum + lead.deal.value, 0);

  const risks = open
    .map((lead) => ({
      ...risk(lead),
      lead,
    }))
    .filter((item) => item.score >= 30)
    .sort((a, b) => b.score - a.score);

  const overdue = open.flatMap((lead) =>
    lead.tasks
      .filter(
        (task) =>
          !task.completed &&
          new Date(task.dueDate + 'T23:59:59') < new Date()
      )
      .map((task) => ({
        lead,
        task,
      }))
  );

  const stageCounts = Object.fromEntries(
    stages.map((stage) => [
      stage,
      leads.filter((lead) => lead.deal.stage === stage).length,
    ])
  );

  const highRiskValue = risks
    .filter((item) => item.level === 'High')
    .reduce((sum, item) => sum + item.lead.deal.value, 0);

  const healthyValue = open
    .filter((lead) => risk(lead).level === 'Healthy')
    .reduce((sum, lead) => sum + lead.deal.value, 0);

  const attentionCount = risks.length + overdue.length;

  const winRate =
    leads.length > 0
      ? Math.round(
          (leads.filter((lead) => lead.deal.stage === 'Won').length /
            leads.filter((lead) =>
              ['Won', 'Lost'].includes(lead.deal.stage)
            ).length) *
            100
        ) || 0
      : 0;

  return {
    pipeline,
    won,
    openCount: open.length,
    highRisk: risks.filter((item) => item.level === 'High').length,
    highRiskValue,
    healthyValue,
    attentionCount,
    winRate,
    risks,
    overdue,
    stageCounts,
  };
}

export function fallbackSummary(lead: Lead) {
  const latest = [...lead.activities]
    .sort(
      (a, b) =>
        +new Date(b.createdAt) - +new Date(a.createdAt)
    )
    .slice(0, 4);

  const intelligence = risk(lead);

  const missing: string[] = [];

  if (!lead.notes.length) {
    missing.push('Rep note');
  }

  if (!lead.tasks.some((task) => !task.completed)) {
    missing.push('Open follow-up task');
  }

  if (
    !lead.activities.some((activity) =>
      /decision|timeline|approval/i.test(
        `${activity.title} ${activity.description}`
      )
    )
  ) {
    missing.push('Decision timeline or approval status');
  }

  return {
    who: `${lead.name} is ${lead.title} at ${lead.company}.`,
    important: `${lead.company} is evaluating ${lead.deal.name} at ${money(
      lead.deal.value
    )} in ${lead.deal.stage}.`,
    happened: latest.map(
      (activity) =>
        `${activity.title}: ${activity.description}`
    ),
    missing: missing.length
      ? missing
      : ['No obvious missing CRM fields detected'],
    risk: {
      score: intelligence.score,
      level: intelligence.level,
      reasons: intelligence.reasons,
    },
    nextAction: nextAction(lead),
    source: 'local',
  };
}

export function nextAction(lead: Lead) {
  const intelligence = risk(lead);

  const overdueTask = lead.tasks.find(
    (task) =>
      !task.completed &&
      new Date(task.dueDate + 'T23:59:59') < new Date()
  );

  if (overdueTask) {
    return `Complete or reschedule "${overdueTask.title}" and record the customer response.`;
  }

  const openTask = lead.tasks.find((task) => !task.completed);

  if (openTask) {
    return `Complete "${openTask.title}" and capture the outcome in the activity timeline.`;
  }

  if (lead.deal.stage === 'New') {
    return 'Qualify the opportunity and capture the customer problem, timeline, and decision process.';
  }

  if (lead.deal.stage === 'Qualified') {
    return 'Schedule the next discovery or technical evaluation and confirm decision criteria.';
  }

  if (lead.deal.stage === 'Proposal') {
    return 'Follow up on the proposal and confirm objections, decision timeline, and approval path.';
  }

  if (lead.deal.stage === 'Negotiation') {
    return 'Confirm remaining commercial blockers and document the final approval path.';
  }

  return (
    intelligence.reasons[0] ||
    'Review the account and choose the next customer-facing action.'
  );
}
