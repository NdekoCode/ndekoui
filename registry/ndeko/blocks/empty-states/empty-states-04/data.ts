export type SceneId = 'runs' | 'inbox' | 'tools' | 'agents';

export type SceneCopy = {
  id: SceneId;
  tab: string;
  title: string;
  description: string;
  idle: string;
  busy: string;
  done: string;
};

export const SCENES: SceneCopy[] = [
  {
    id: 'runs',
    tab: 'No runs',
    title: 'No runs yet',
    description:
      'Runs appear here as soon as an agent starts one. Start the first and follow it step by step.',
    idle: 'Start a run',
    busy: 'Starting',
    done: 'Started',
  },
  {
    id: 'inbox',
    tab: 'Empty inbox',
    title: 'Inbox zero',
    description:
      'Every request has an answer. New ones land here the moment they arrive.',
    idle: 'Open the archive',
    busy: 'Opening',
    done: 'Opened',
  },
  {
    id: 'tools',
    tab: 'No tools',
    title: 'No tools connected',
    description:
      'Connect the tools your agents work in, and they can read and act on them with your approval.',
    idle: 'Connect a tool',
    busy: 'Connecting',
    done: 'Connected',
  },
  {
    id: 'agents',
    tab: 'No agents',
    title: 'No agents yet',
    description:
      'An agent takes a job and works through it while you do something else. Add one to begin.',
    idle: 'Add an agent',
    busy: 'Adding',
    done: 'Added',
  },
];

export const FIRST_SCENE: SceneId = 'runs';
