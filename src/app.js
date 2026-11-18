import { scenarios } from './scenarios.js';
import { formatTime, readView, snapshot, statusLabels, writeView } from './replay.js';

const elements = Object.fromEntries([
  'share', 'run-title', 'run-description', 'scenario', 'previous', 'play', 'next',
  'position', 'step-count', 'elapsed', 'clear', 'connections', 'root', 'workers',
  'agent-detail', 'activity-scope', 'events', 'empty', 'notice',
].map(id => [id, document.getElementById(id)]));

let view = readView(location.hash, scenarios);
let playback;
let displayedScenario;
let noticeTimer;
let agentButtons = new Map();

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

for (const scenario of scenarios) {
  const option = element('option', '', scenario.title);
  option.value = scenario.id;
  elements.scenario.append(option);
}

function useView(nextView) {
  view = nextView;
  if (location.hash !== writeView(view)) history.replaceState(null, '', writeView(view));
  render();
}

function setStep(step) {
  useView({ ...view, step: Math.max(0, Math.min(step, view.scenario.events.length)) });
}

function setAgent(agent) {
  useView({ ...view, agent: agent === view.agent ? null : agent });
}

function stopPlayback() {
  clearInterval(playback);
  playback = undefined;
  elements.play.textContent = view.step === view.scenario.events.length ? 'Replay' : 'Play';
}

function togglePlayback() {
  if (playback) {
    stopPlayback();
    return;
  }
  if (view.step === view.scenario.events.length) setStep(0);
  playback = setInterval(() => {
    setStep(view.step + 1);
    if (view.step === view.scenario.events.length) stopPlayback();
  }, 900);
  elements.play.textContent = 'Pause';
}

elements.scenario.addEventListener('change', () => {
  const selected = scenarios.find(scenario => scenario.id === elements.scenario.value);
  if (!selected) return;
  stopPlayback();
  useView({ scenario: selected, step: 0, agent: null });
});
elements.previous.addEventListener('click', () => { stopPlayback(); setStep(view.step - 1); });
elements.next.addEventListener('click', () => { stopPlayback(); setStep(view.step + 1); });
elements.play.addEventListener('click', togglePlayback);
elements.position.addEventListener('input', () => { stopPlayback(); setStep(Number(elements.position.value)); });
elements.clear.addEventListener('click', () => setAgent(null));
window.addEventListener('hashchange', () => {
  stopPlayback();
  useView(readView(location.hash, scenarios));
});

elements.share.addEventListener('click', async () => {
  clearTimeout(noticeTimer);
  const link = new URL(location.href);
  link.hash = writeView(view);
  elements.notice.hidden = false;
  try {
    await navigator.clipboard.writeText(link.href);
    elements.notice.textContent = 'View link copied.';
    noticeTimer = setTimeout(() => { elements.notice.hidden = true; }, 3500);
  } catch {
    const field = element('input', 'share-link');
    field.value = link.href;
    field.readOnly = true;
    field.setAttribute('aria-label', 'View link');
    elements.notice.replaceChildren(field);
    field.focus();
    field.select();
  }
});

function drawConnections(status) {
  const canvas = elements.connections;
  const box = canvas.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return;
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(box.width * scale);
  canvas.height = Math.round(box.height * scale);
  const context = canvas.getContext('2d');
  if (!context) return;
  context.scale(scale, scale);
  const [root, ...workers] = view.scenario.agents;
  const source = agentButtons.get(root.id).getBoundingClientRect();
  const sourceX = source.right - box.left;
  const sourceY = (source.top + source.bottom) / 2 - box.top;

  for (const worker of workers) {
    const target = agentButtons.get(worker.id).getBoundingClientRect();
    const targetX = target.left - box.left;
    const targetY = (target.top + target.bottom) / 2 - box.top;
    const middle = (sourceX + targetX) / 2;
    const selected = view.agent === worker.id || view.agent === root.id;
    context.strokeStyle = selected ? '#456de2' : '#a6b2c7';
    context.lineWidth = selected ? 2 : 1.25;
    context.setLineDash(status.get(worker.id) === 'waiting' ? [3, 4] : []);
    context.beginPath();
    context.moveTo(sourceX, sourceY);
    context.bezierCurveTo(middle, sourceY, middle, targetY, targetX - 3, targetY);
    context.stroke();
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(targetX - 8, targetY - 4);
    context.lineTo(targetX - 3, targetY);
    context.lineTo(targetX - 8, targetY + 4);
    context.stroke();
  }
}

function rebuildAgents() {
  elements.root.replaceChildren();
  elements.workers.replaceChildren();
  agentButtons = new Map();
  view.scenario.agents.forEach((agent, index) => {
    const button = element('button', 'agent');
    button.type = 'button';
    button.append(
      element('strong', 'agent-name', agent.name),
      element('span', 'agent-status'),
    );
    button.addEventListener('click', () => setAgent(agent.id));
    (index === 0 ? elements.root : elements.workers).append(button);
    agentButtons.set(agent.id, button);
  });
}

function renderAgents({ status }) {
  for (const [id, button] of agentButtons) {
    const state = status.get(id);
    button.dataset.state = state;
    button.setAttribute('aria-pressed', String(view.agent === id));
    button.querySelector('.agent-status').textContent = statusLabels[state];
  }
  const active = view.scenario.agents.find(agent => agent.id === view.agent);
  elements['agent-detail'].replaceChildren(
    element('strong', '', active?.name ?? 'All agents'),
    element('span', '', active?.role ?? 'Select an agent to filter the activity feed.'),
  );
  elements.clear.disabled = !active;
  drawConnections(status);
}

function renderActivity(events) {
  const agent = view.scenario.agents.find(item => item.id === view.agent);
  const visible = agent ? events.filter(event => event.agent === agent.id) : events;
  const names = new Map(view.scenario.agents.map(item => [item.id, item.name]));
  elements['activity-scope'].textContent = agent ? agent.name : 'All agents · most recent first';
  elements.empty.hidden = visible.length > 0;
  elements.events.replaceChildren(...visible.slice().reverse().map(event => {
    const item = element('li', 'event');
    item.dataset.state = event.state;
    const time = element('time', 'event-time', formatTime(event.at));
    time.dateTime = `PT${event.at}S`;
    const copy = element('div', 'event-copy');
    copy.append(
      element('span', 'event-agent', names.get(event.agent)),
      element('strong', '', event.title),
      element('p', '', event.detail),
    );
    item.append(time, copy);
    return item;
  }));
}

function render() {
  if (displayedScenario !== view.scenario) {
    displayedScenario = view.scenario;
    elements['run-title'].textContent = view.scenario.title;
    elements['run-description'].textContent = view.scenario.description;
    elements.scenario.value = view.scenario.id;
    rebuildAgents();
  }
  const current = snapshot(view.scenario, view.step);
  const end = view.scenario.events.length;
  elements.previous.disabled = view.step === 0;
  elements.next.disabled = view.step === end;
  if (!playback) elements.play.textContent = view.step === end ? 'Replay' : 'Play';
  elements.position.max = end;
  elements.position.value = view.step;
  elements.position.setAttribute('aria-valuetext', `Event ${view.step} of ${end}`);
  elements['step-count'].textContent = `${view.step} / ${end}`;
  elements.elapsed.textContent = formatTime(current.elapsed);
  renderAgents(current);
  renderActivity(current.events);
}

useView(view);
new ResizeObserver(() => drawConnections(snapshot(view.scenario, view.step).status)).observe(elements.connections);
