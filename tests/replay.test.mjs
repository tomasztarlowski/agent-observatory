import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarios } from '../src/scenarios.js';
import { readView, snapshot, writeView } from '../src/replay.js';

test('every sample has valid agents, states, and ordered times', () => {
  const scenarioIds = new Set(scenarios.map(scenario => scenario.id));
  assert.equal(scenarioIds.size, scenarios.length);
  for (const scenario of scenarios) {
    const agents = new Set(scenario.agents.map(agent => agent.id));
    assert.equal(agents.size, scenario.agents.length);
    assert.ok(scenario.agents.length > 1);
    let previous = 0;
    for (const event of scenario.events) {
      assert.ok(agents.has(event.agent));
      assert.ok(['active', 'blocked', 'done'].includes(event.state));
      assert.ok(Number.isSafeInteger(event.at) && event.at >= previous);
      previous = event.at;
    }
  }
});

test('replay status follows the selected event and supports rewinding', () => {
  const docs = scenarios[0];
  assert.equal(snapshot(docs, 0).status.get('tester'), 'waiting');
  assert.equal(snapshot(docs, 4).status.get('tester'), 'blocked');
  assert.equal(snapshot(docs, 6).status.get('tester'), 'active');
  const complete = snapshot(docs, 100);
  assert.equal(complete.events.length, docs.events.length);
  assert.equal(complete.elapsed, 72);
  assert.equal(complete.status.get('lead'), 'done');
  assert.equal(snapshot(docs, 3).status.get('tester'), 'active');
});

test('view links round-trip and reject invalid state', () => {
  const view = { scenario: scenarios[1], step: 5, agent: 'quality' };
  assert.deepEqual(readView(writeView(view), scenarios), view);
  const invalid = readView('#scenario=other&step=NaN&agent=other', scenarios);
  assert.deepEqual(invalid, { scenario: scenarios[0], step: 0, agent: null });
});
