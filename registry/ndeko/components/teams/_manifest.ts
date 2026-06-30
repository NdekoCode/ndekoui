import type { ComponentManifest } from '@/registry/ndeko/components/types';

export const manifest: ComponentManifest = [
  {
    name: 'teams-01',
    source: 'ndeko',
    title: 'Team card',
    description:
      'A team with its member stack, open tasks and time this week, where Join turns into Joined and your face joins the stack.',
  },
  {
    name: 'teams-02',
    source: 'ndeko',
    title: 'Team switcher',
    description:
      'A pill with the current team that opens every team with its tile and member count, the picked one marked.',
  },
  {
    name: 'teams-03',
    source: 'ndeko',
    title: 'Member row',
    description:
      'One member with presence on the avatar, the current task and time today, a role menu, and removal that turns into Undo.',
  },
  {
    name: 'teams-04',
    source: 'ndeko',
    title: 'Members with roles',
    description:
      'The members of a team with a role menu on each row, a last manager who cannot step down, and a pending invite to revoke.',
  },
  {
    name: 'teams-05',
    source: 'ndeko',
    title: 'Empty team that invites',
    description:
      'A team with dashed seats that fill with each address invited, the Invite button going through Sending to Sent.',
  },
  {
    name: 'teams-06',
    source: 'ndeko',
    title: 'Team settings',
    description:
      'Name, colour, visibility, join requests and a hold to archive, with the team tile following every change.',
  },
  {
    name: 'teams-07',
    source: 'ndeko',
    title: 'Member card that flips',
    description:
      'A member card whose Details button turns it over to the email, local time, teams and hours of the week.',
  },
  {
    name: 'teams-08',
    source: 'ndeko',
    title: 'Workload per member',
    description:
      'Planned hours against capacity for each member, this week or next, with the people over capacity in warning.',
  },
  {
    name: 'teams-09',
    source: 'ndeko',
    title: 'Team picker with search',
    description:
      'A searchable list of teams for moving a task, where the mark travels to the team picked and an empty search offers a way back.',
  },
];
