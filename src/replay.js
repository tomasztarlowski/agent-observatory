export const statusLabels = {
  waiting: 'Waiting',
  active: 'In progress',
  blocked: 'Blocked',
  done: 'Complete',
};

export function clampStep(step, eventCount) {
  return Number.isSafeInteger(step) ? Math.max(0, Math.min(step, eventCount)) : 0;
}

export function snapshot(scenario, step) {
  const events = scenario.events.slice(0, clampStep(step, scenario.events.length));
  const status = new Map(scenario.agents.map(agent => [agent.id, 'waiting']));
  for (const event of events) status.set(event.agent, event.state);
  return { events, status, elapsed: events.at(-1)?.at ?? 0 };
}

export function readView(hash, scenarios) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const scenario = scenarios.find(item => item.id === params.get('scenario')) ?? scenarios[0];
  const cursor = params.get('step');
  const step = clampStep(cursor === null ? Math.min(4, scenario.events.length) : Number(cursor), scenario.events.length);
  const candidate = params.get('agent');
  const agent = scenario.agents.some(item => item.id === candidate) ? candidate : null;
  return { scenario, step, agent };
}

export function writeView({ scenario, step, agent }) {
  const params = new URLSearchParams({ scenario: scenario.id, step: String(step) });
  if (agent) params.set('agent', agent);
  return '#' + params.toString();
}

export function formatTime(seconds) {
  return [Math.floor(seconds / 60), seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
}
