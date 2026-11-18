# Agent Observatory

Agent Observatory replays sample multi-agent runs in a browser. Use the map to inspect assignments, use the timeline to step through events, and select an agent to filter their activity. A view link preserves the scenario, replay position, and selected agent.

Try the [public demo](https://tomasztarlowski.github.io/agent-observatory/) or open the project from a static web server. The site runs on static hosting with no build step, server-side code, accounts, or API keys. It ships with two synthetic scenarios. The site does not ask for files, read machine data, send requests to external services, or store replay state outside the URL. Copying a view link includes only an ID from the demo catalog, an event number, and an optional agent ID.

To develop it, serve this directory over HTTP and open the URL in a current browser. To run the tests with Node.js:

```sh
node --test
```

## Add a sample

Add a scenario to `src/scenarios.js`. A scenario has a stable ID, a title, a description, an array of agents with unique IDs, and a chronological array of events. The first agent is the coordinator in the map. Each event records elapsed whole seconds, an agent ID, a state, and display text. Valid states are `active`, `blocked`, and `done`. Before an agent's first event it appears as `waiting`.
