import { AGENTS, REQUESTS, RUNS, type Agent } from './data';
import {
  decisionTextOf,
  type ActivityEntry,
  type DecisionEntry,
  type RunEntry,
} from './session';

export type EntryMark = 'running' | 'done' | 'allowed' | 'denied';

export type EntryView = {
  /** Who did it: an agent, or null when the person did. */
  agent: Agent | null;
  text: string;
  detail: string;
  mark: EntryMark;
};

function viewOfRun(entry: RunEntry): EntryView {
  const seed = RUNS[entry.id];
  const agent = AGENTS[seed.agentId];
  if (entry.status === 'running') {
    return {
      agent,
      text: seed.runningText,
      detail: seed.runningDetail,
      mark: 'running',
    };
  }
  return { agent, text: seed.doneText, detail: seed.doneDetail, mark: 'done' };
}

function viewOfDecision(entry: DecisionEntry): EntryView {
  const request = REQUESTS[entry.requestId];
  const text = decisionTextOf(entry.requestId, entry.decision);
  const detail = `Asked by ${AGENTS[request.agentId].name}, answered just now`;
  if (entry.decision === 'approved') {
    return { agent: null, text, detail, mark: 'allowed' };
  }
  return { agent: null, text, detail, mark: 'denied' };
}

export function viewOfEntry(entry: ActivityEntry): EntryView {
  if (entry.kind === 'run') {
    return viewOfRun(entry);
  }
  return viewOfDecision(entry);
}
