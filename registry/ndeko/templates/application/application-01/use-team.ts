'use client';

import { useState } from 'react';

import {
  INVITATIONS,
  MEMBERS,
  OPEN_TASKS,
  type Invitation,
  type Member,
  type MemberTask,
  type Role,
  type StatusId,
} from './data';
import type { MemberActions } from './member-card';

function updateMember(
  members: Member[],
  memberId: string,
  change: (member: Member) => Member
) {
  return members.map((member) => {
    if (member.id !== memberId) {
      return member;
    }
    return change(member);
  });
}

function withAddedTime(member: Member, minutes: number): Member {
  const task = member.task;
  if (!task) {
    return member;
  }
  const hasEntry = member.activity.some((entry) => entry.taskId === task.id);
  if (!hasEntry) {
    const entry = {
      taskId: task.id,
      number: task.number,
      title: task.title,
      minutes,
    };
    return { ...member, activity: [entry, ...member.activity] };
  }
  const activity = member.activity.map((entry) => {
    if (entry.taskId !== task.id) {
      return entry;
    }
    return { ...entry, minutes: entry.minutes + minutes };
  });
  return { ...member, activity };
}

/** The team of the Team page, kept by the shell so a visit to another page leaves it as it was. */
export function useTeam() {
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [invitations, setInvitations] = useState<Invitation[]>(INVITATIONS);
  const [openTasks, setOpenTasks] = useState<MemberTask[]>(OPEN_TASKS);

  function returnTask(task: MemberTask | null) {
    if (!task) {
      return;
    }
    setOpenTasks((previous) => [task, ...previous]);
  }

  const actions: MemberActions = {
    assignTask(memberId, task) {
      setOpenTasks((previous) =>
        previous.filter((candidate) => candidate.id !== task.id)
      );
      setMembers((previous) =>
        updateMember(previous, memberId, (member) => ({
          ...member,
          task,
          estimateMinutes: 0,
        }))
      );
    },
    unassignTask(memberId) {
      const member = members.find((candidate) => candidate.id === memberId);
      returnTask(member?.task ?? null);
      setMembers((previous) =>
        updateMember(previous, memberId, (current) => ({
          ...current,
          task: null,
          estimateMinutes: 0,
        }))
      );
    },
    changeStatus(memberId, status: StatusId) {
      setMembers((previous) =>
        updateMember(previous, memberId, (member) => {
          if (!member.task) {
            return member;
          }
          return { ...member, task: { ...member.task, status } };
        })
      );
    },
    changeEstimate(memberId, minutes) {
      setMembers((previous) =>
        updateMember(previous, memberId, (member) => ({
          ...member,
          estimateMinutes: minutes,
        }))
      );
    },
    addTime(memberId, minutes) {
      setMembers((previous) =>
        updateMember(previous, memberId, (member) =>
          withAddedTime(member, minutes)
        )
      );
    },
    changeRole(memberId, role: Role) {
      setMembers((previous) =>
        updateMember(previous, memberId, (member) => ({ ...member, role }))
      );
    },
    removeMember(memberId) {
      const member = members.find((candidate) => candidate.id === memberId);
      returnTask(member?.task ?? null);
      setMembers((previous) =>
        previous.filter((candidate) => candidate.id !== memberId)
      );
    },
  };

  function invite(email: string) {
    const invitation: Invitation = {
      id: `invite-${email}`,
      email,
      role: 'member',
      sentLabel: 'Sent just now',
    };
    setInvitations((previous) => [...previous, invitation]);
  }

  function resendInvitation(invitationId: string) {
    setInvitations((previous) =>
      previous.map((invitation) => {
        if (invitation.id !== invitationId) {
          return invitation;
        }
        return { ...invitation, sentLabel: 'Sent again just now' };
      })
    );
  }

  function revokeInvitation(invitationId: string) {
    setInvitations((previous) =>
      previous.filter((invitation) => invitation.id !== invitationId)
    );
  }

  return {
    members,
    invitations,
    openTasks,
    actions,
    invite,
    resendInvitation,
    revokeInvitation,
  };
}

export type TeamState = ReturnType<typeof useTeam>;
