import {
  ADDER,
  CHECK_CODE,
  CHECK_TEXT,
  INIT_ARGS,
  KEY_CODE,
  KEYS_TEXT,
  KEYS_WARNING,
  MANUAL_STEPS,
  NEXT_STEPS,
  PACKAGE,
  PAGE,
  REQUIREMENTS,
  RUNNER,
  type Manager,
} from './data';

export type TextFormat = 'plain' | 'markdown';

function headingOf(text: string, level: number, format: TextFormat) {
  if (format === 'plain') {
    return text;
  }
  const marks = '#'.repeat(level);
  return `${marks} ${text}`;
}

function codeOf(code: string, language: string, format: TextFormat) {
  if (format === 'plain') {
    return code;
  }
  return ['```' + language, code, '```'].join('\n');
}

function bulletOf(text: string, format: TextFormat) {
  if (format === 'plain') {
    return text;
  }
  return `- ${text}`;
}

function manualLinesOf(manager: Manager, format: TextFormat) {
  const lines: string[] = [];
  MANUAL_STEPS.forEach((step, index) => {
    lines.push(`${index + 1}. ${step.title}`);
    if (step.id === 'package') {
      const command = `${ADDER[manager]} ${PACKAGE}`;
      lines.push(codeOf(command, 'sh', format));
    }
    if (step.code) {
      lines.push(codeOf(step.code, 'tsx', format));
    }
  });
  return lines;
}

export function pageTextOf(manager: Manager, format: TextFormat) {
  const initCommand = `${RUNNER[manager]} ${INIT_ARGS}`;
  const requirements = REQUIREMENTS.map((line) => bulletOf(line, format));
  const nextSteps = NEXT_STEPS.map((step) => bulletOf(step.title, format));
  const manualLines = manualLinesOf(manager, format);
  const blocks = [
    headingOf(PAGE.title, 1, format),
    PAGE.lead,
    headingOf('Requirements', 2, format),
    requirements.join('\n'),
    headingOf('Install', 2, format),
    'With the command line:',
    codeOf(initCommand, 'sh', format),
    'By hand:',
    manualLines.join('\n'),
    headingOf('Add your keys', 2, format),
    KEYS_TEXT,
    codeOf(KEY_CODE, 'sh', format),
    KEYS_WARNING,
    headingOf('Check that it works', 2, format),
    CHECK_TEXT,
    codeOf(CHECK_CODE, 'tsx', format),
    headingOf('Next steps', 2, format),
    nextSteps.join('\n'),
  ];
  return blocks.join('\n\n');
}
