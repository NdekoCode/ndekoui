'use client';

import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';

import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { usePress } from '@/registry/ndeko/lib/demonstration';

import type { PaletteEntry } from './catalog';
import { previousOf } from './flow';
import type { InsertAt, Workflow } from './model';
import { waitingIdOf, type Decision } from './run';
import { sampleOf, type Sample, type SampleId } from './samples';
import { SAVE_MS } from './script';
import type { BuilderAction, BuilderState } from './session';
import {
  CANVAS_FRAME,
  INSPECTOR_HEADING,
  useFocusLater,
} from './use-focus-later';

/** How long the line "Step removed, Undo" stays in the tool bar. */
const NOTICE_MS = 6000;

/** A step picked in the palette goes after the selected one, or at the end of the flow when none is. */
export function paletteTargetOf(selectedId: string | null): InsertAt {
  if (selectedId === null) {
    return { at: 'end' };
  }
  return { at: 'after', stepId: selectedId };
}

export type Backend = {
  onRun?: (workflow: Workflow, sample: Sample) => void;
  onSave?: (workflow: Workflow) => void;
  onPublish?: (workflow: Workflow) => void;
  onApprove?: (stepId: string) => void;
  onDeny?: (stepId: string) => void;
};

type HandlerContext = {
  state: BuilderState;
  act: (action: BuilderAction) => void;
  hasInspectorSheet: boolean;
  hasPaletteSheet: boolean;
  backend: Backend;
};

/**
 * What a person does on the builder. The handlers read the state at the moment they run, so they
 * keep their identity, and the memoised canvas, top bar and tool bar stay still while a step is typed into.
 */
export function useBuilderHandlers(
  rootRef: RefObject<HTMLElement | null>,
  { state, act, hasInspectorSheet, hasPaletteSheet, backend }: HandlerContext
) {
  const { onRun, onSave, onPublish, onApprove, onDeny } = backend;
  const { schedule } = useTimeouts();
  const { focusLater, focusNode } = useFocusLater(rootRef);
  const { pressed: echo, press: echoKey } = usePress<'undo' | 'redo'>();
  const mintedCount = useRef(0);
  const latest = useRef(state);

  useLayoutEffect(() => {
    latest.current = state;
  });

  const mintId = useCallback(() => {
    mintedCount.current += 1;
    return `step-${mintedCount.current}`;
  }, []);

  /** In the sheet of a narrow page a pick closes the sheet, and the focus goes to the step that arrived. */
  const pickEntry = useCallback(
    (entry: PaletteEntry) => {
      const id = mintId();
      const at = paletteTargetOf(latest.current.selectedId);
      act({ type: 'stepAdded', entryId: entry.id, at, id });
      if (hasPaletteSheet) {
        act({ type: 'paletteSheet', isOpen: false });
        focusNode(id);
      }
    },
    [act, mintId, focusNode, hasPaletteSheet]
  );

  /** Enter or Space on a step moves the focus to the heading of its setup. A tap only selects. */
  const select = useCallback(
    (id: string, isFromKeyboard: boolean) => {
      act({ type: 'selected', id });
      if (!isFromKeyboard) {
        return;
      }
      if (hasInspectorSheet) {
        act({ type: 'inspectorSheet', isOpen: true });
      }
      focusLater(INSPECTOR_HEADING);
    },
    [act, hasInspectorSheet, focusLater]
  );

  /** Escape in the setup gives the focus back to the step it belongs to. */
  const leaveInspector = useCallback(() => {
    const { selectedId } = latest.current;
    if (hasInspectorSheet) {
      act({ type: 'inspectorSheet', isOpen: false });
    }
    if (selectedId === null) {
      focusLater(CANVAS_FRAME);
      return;
    }
    focusNode(selectedId);
  }, [act, hasInspectorSheet, focusLater, focusNode]);

  const openInspector = useCallback(() => {
    act({ type: 'inspectorSheet', isOpen: true });
    focusLater(INSPECTOR_HEADING);
  }, [act, focusLater]);

  const openPalette = useCallback(() => {
    act({ type: 'paletteSheet', isOpen: true });
    focusLater('[data-sheet-close="palette"]');
  }, [act, focusLater]);

  const closePalette = useCallback(() => {
    act({ type: 'paletteSheet', isOpen: false });
    focusLater('[data-sheet-open="palette"]');
  }, [act, focusLater]);

  const forgetNoticeLater = useCallback(() => {
    const token = latest.current.noticeCount + 1;
    schedule(() => act({ type: 'noticeCleared', token }), NOTICE_MS);
  }, [act, schedule]);

  /** The step leaves with its button, so the focus goes to the step read just before it. */
  const remove = useCallback(
    (id: string) => {
      const previous = previousOf(latest.current.workflow, id);
      act({ type: 'stepRemoved', id });
      forgetNoticeLater();
      if (previous) {
        focusNode(previous.id);
        return;
      }
      focusLater(CANVAS_FRAME);
    },
    [act, forgetNoticeLater, focusNode, focusLater]
  );

  const duplicate = useCallback(
    (id: string) => {
      const copyId = mintId();
      act({ type: 'stepDuplicated', id, copyId });
      focusNode(copyId);
    },
    [act, mintId, focusNode]
  );

  const insert = useCallback(
    (at: InsertAt, entry: PaletteEntry) => {
      const id = mintId();
      act({ type: 'stepAdded', entryId: entry.id, at, id });
      focusNode(id);
    },
    [act, mintId, focusNode]
  );

  const renameStep = useCallback(
    (id: string, name: string) => {
      act({ type: 'stepRenamed', id, name });
    },
    [act]
  );

  const renameWorkflow = useCallback(
    (name: string) => {
      act({ type: 'workflowRenamed', name });
    },
    [act]
  );

  const undo = useCallback(() => {
    act({ type: 'undone' });
  }, [act]);

  const redo = useCallback(() => {
    act({ type: 'redone' });
  }, [act]);

  /** The line that offered Undo leaves once it is pressed, so the focus goes to the step it brought back. */
  const undoFromNotice = useCallback(() => {
    const restoredId = latest.current.notice?.restoresId ?? null;
    undo();
    if (restoredId === null) {
      focusLater(CANVAS_FRAME);
      return;
    }
    focusNode(restoredId);
  }, [undo, focusLater, focusNode]);

  const undoFromKeys = useCallback(() => {
    undo();
    echoKey('undo');
  }, [undo, echoKey]);

  const redoFromKeys = useCallback(() => {
    redo();
    echoKey('redo');
  }, [redo, echoKey]);

  /** A backend would answer the save itself: here it comes back after a moment. */
  const save = useCallback(() => {
    act({ type: 'saveStarted' });
    schedule(() => act({ type: 'saved' }), SAVE_MS);
    onSave?.(latest.current.workflow);
  }, [act, schedule, onSave]);

  const publish = useCallback(
    (isLive: boolean) => {
      act({ type: 'published', isLive });
      forgetNoticeLater();
      if (isLive) {
        onPublish?.(latest.current.workflow);
      }
    },
    [act, forgetNoticeLater, onPublish]
  );

  const startRun = useCallback(
    (sampleId: SampleId) => {
      act({ type: 'runStarted', sampleId });
      onRun?.(latest.current.workflow, sampleOf(sampleId));
    },
    [act, onRun]
  );

  /** Test run in the top bar sends the email of the last run again. */
  const runAgain = useCallback(() => {
    startRun(latest.current.run.sampleId);
  }, [startRun]);

  const clearRun = useCallback(() => {
    act({ type: 'runCleared' });
  }, [act]);

  /** The two buttons leave with the card, so the focus goes to the step, which now says what was decided. */
  const decide = useCallback(
    (decision: Decision) => {
      const stepId = waitingIdOf(latest.current.run);
      act({ type: 'decided', decision });
      if (stepId === null) {
        return;
      }
      focusNode(stepId);
      if (decision === 'approved') {
        onApprove?.(stepId);
        return;
      }
      onDeny?.(stepId);
    },
    [act, focusNode, onApprove, onDeny]
  );

  return {
    echo,
    mintId,
    pickEntry,
    select,
    leaveInspector,
    openInspector,
    openPalette,
    closePalette,
    remove,
    duplicate,
    insert,
    renameStep,
    renameWorkflow,
    undo,
    redo,
    undoFromNotice,
    undoFromKeys,
    redoFromKeys,
    save,
    publish,
    startRun,
    runAgain,
    clearRun,
    decide,
  };
}
