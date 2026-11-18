const docs = {
  id: 'docs',
  title: 'Documentation release',
  description: 'Replay a team preparing, testing, and reviewing a documentation update.',
  agents: [
    { id: 'lead', name: 'Coordinator', role: 'Assigns work and closes the run' },
    { id: 'writer', name: 'Documentation', role: 'Updates the onboarding guide' },
    { id: 'tester', name: 'Verification', role: 'Checks the installation steps' },
    { id: 'reviewer', name: 'Review', role: 'Checks clarity and completeness' },
  ],
  events: [
    { at: 0, agent: 'lead', state: 'active', title: 'Run started', detail: 'Set the scope for the onboarding update.' },
    { at: 5, agent: 'writer', state: 'active', title: 'Guide update assigned', detail: 'Rewrite the setup instructions using a new example.' },
    { at: 12, agent: 'tester', state: 'active', title: 'Verification started', detail: 'Follow the setup steps on a clean test environment.' },
    { at: 23, agent: 'tester', state: 'blocked', title: 'Missing prerequisite', detail: 'One dependency is absent from the setup instructions.' },
    { at: 33, agent: 'writer', state: 'done', title: 'Guide updated', detail: 'Added the missing dependency and a complete setup example.' },
    { at: 42, agent: 'tester', state: 'active', title: 'Verification resumed', detail: 'Retry the revised steps from a clean environment.' },
    { at: 49, agent: 'tester', state: 'done', title: 'Setup verified', detail: 'The sample starts after following the revised steps.' },
    { at: 55, agent: 'reviewer', state: 'active', title: 'Review started', detail: 'Check names, code samples, and links.' },
    { at: 67, agent: 'reviewer', state: 'done', title: 'Review completed', detail: 'The release notes and guide match the verified example.' },
    { at: 72, agent: 'lead', state: 'done', title: 'Run completed', detail: 'All documentation checks passed in the sample run.' },
  ],
};

const dataset = {
  id: 'dataset',
  title: 'Dataset quality check',
  description: 'Follow a team checking a sample dataset before handing off a summary.',
  agents: [
    { id: 'lead', name: 'Coordinator', role: 'Sets the review scope' },
    { id: 'schema', name: 'Schema check', role: 'Validates columns and types' },
    { id: 'quality', name: 'Quality check', role: 'Looks for missing and duplicate rows' },
    { id: 'report', name: 'Summary', role: 'Writes the quality report' },
  ],
  events: [
    { at: 0, agent: 'lead', state: 'active', title: 'Check started', detail: 'Use a generated table of fictional orders.' },
    { at: 7, agent: 'schema', state: 'active', title: 'Schema inspection started', detail: 'Compare columns and value types to the fixture spec.' },
    { at: 13, agent: 'quality', state: 'active', title: 'Row checks started', detail: 'Count absent values and repeated order references.' },
    { at: 22, agent: 'schema', state: 'done', title: 'Schema verified', detail: 'The sample columns match the expected types.' },
    { at: 34, agent: 'quality', state: 'done', title: 'Row checks completed', detail: 'The example contains two duplicate rows and one missing date.' },
    { at: 40, agent: 'report', state: 'active', title: 'Summary started', detail: 'Record the checks and the findings.' },
    { at: 53, agent: 'report', state: 'done', title: 'Summary ready', detail: 'The report links each finding to its check.' },
    { at: 59, agent: 'lead', state: 'done', title: 'Handoff completed', detail: 'The sample report is ready for review.' },
  ],
};

export const scenarios = [docs, dataset];
