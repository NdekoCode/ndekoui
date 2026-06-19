# Port progress

Status of the Origin UI catalogue (604 compositions, 30 categories) and of the pieces it needs. Update this table when a batch lands. The brief is `docs/PORTING-GUIDE.md`.

Statuses: `todo`, `in progress`, `ported` (files written, typecheck and lint clean), `reviewed` (read by the maintainer), `blocked` (waits for a primitive).

## Wave 1: categories that need no new primitive

| Batch | Category  | Count | Hooks owned           | Status |
| ----- | --------- | ----- | --------------------- | ------ |
| W0    | button    | 54    | use-file-upload       | ported |
| W1-A  | accordion | 20    |                       | ported |
| W1-A  | tabs      | 20    |                       | ported |
| W1-B  | alert     | 12    |                       | ported |
| W1-B  | banner    | 12    |                       | ported |
| W1-B  | badge     | 13    |                       | ported |
| W1-B  | avatar    | 23    |                       | ported |
| W1-C  | checkbox  | 20    |                       | ported |
| W1-C  | radio     | 20    |                       | ported |
| W1-C  | switch    | 17    |                       | ported |
| W1-D  | slider    | 27    | use-slider-with-input | ported |
| W1-D  | textarea  | 19    | use-character-limit   | ported |
| W1-E  | dropdown  | 15    |                       | ported |
| W1-E  | popover   | 9     |                       | ported |
| W1-E  | tooltip   | 12    |                       | ported |

## Wave 2: categories that wait for primitives

| Batch | Category             | Count | Needs                                                             | Packages                                                                                                       | Status |
| ----- | -------------------- | ----- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| W2-A  | input                | 59    | select-native, date-field, calendar (react-aria)                  | react-aria-components, @internationalized/date, react-payment-inputs, react-phone-number-input, use-mask-input | ported |
| W2-B  | select               | 51    | command, multiselect, select-native                               | cmdk, react-aria-components                                                                                    | ported |
| W2-C  | dialog               | 21    | command, otp field                                                | cmdk, react-payment-inputs                                                                                     | ported |
| W2-C  | notification         | 22    | toast                                                             | sonner                                                                                                         | ported |
| W2-D  | pagination           | 12    | pagination, use-pagination                                        |                                                                                                                | ported |
| W2-D  | breadcrumb           | 8     | breadcrumb                                                        |                                                                                                                | ported |
| W2-D  | navbar               | 20    | breadcrumb, navigation-menu                                       |                                                                                                                | ported |
| W2-E  | stepper              | 17    | stepper                                                           |                                                                                                                | ported |
| W2-E  | timeline             | 12    | timeline                                                          |                                                                                                                | ported |
| W2-E  | tree                 | 15    | tree                                                              | @headless-tree/core, @headless-tree/react                                                                      | ported |
| W2-F  | table                | 20    | table, pagination                                                 | @tanstack/react-table, @dnd-kit/*                                                                              | ported |
| W2-F  | file-upload          | 14    | table, cropper                                                    |                                                                                                                | ported |
| W2-F  | image-cropper        | 11    | cropper                                                           | @origin-space/image-cropper                                                                                    | ported |
| W2-G  | calendar-date-picker | 28    | calendar (react-day-picker), calendar and date field (react-aria) | react-day-picker, react-aria-components, @internationalized/date                                               | ported |
| W2-G  | event-calendar       | 1     | the event calendar parts                                          | date-fns                                                                                                       | ported |

## Primitives and hooks for wave 2

| Piece                                                              | Status |
| ------------------------------------------------------------------ | ------ |
| hover-card, checkbox-tree                                          | done   |
| breadcrumb, pagination, use-pagination                             | done   |
| select-native, command, combobox (replaces multiselect)            | done   |
| otp field (Base UI), toaster (sonner on the status orb)            | done   |
| stepper, timeline, tree, navigation-menu                           | done   |
| table, cropper                                                     | done   |
| calendar (react-day-picker), calendar and date field on react-aria | done   |

## After the catalogue

| Piece                                               | Count           | Status                                            |
| --------------------------------------------------- | --------------- | ------------------------------------------------- |
| Motion components (`motion-*` items)                | 33              | restyled on the tokens, reduced motion everywhere |
| Chat primitives (`chat-*`, adapted from prompt-kit) | 20              | written                                           |
| Application blocks                                  | 30 in 11 groups | written                                           |
| Marketing blocks                                    | 20 in 10 groups | written                                           |
| Marketing templates                                 | 5               | written                                           |
| Application templates                               | 5               | written                                           |
| Micro-interaction pass, primitives                  | 22 files        | done                                              |
| Micro-interaction pass, wave 1 compositions         | 79 files        | done                                              |

Everything above passes `tsc`, ESLint and Prettier. Nothing has been checked in a browser yet. See `docs/ROADMAP.md` for the launch steps.
