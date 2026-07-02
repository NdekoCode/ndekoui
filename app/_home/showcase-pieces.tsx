import type { ComponentType } from 'react';

import Alert06 from '@/registry/ndeko/components/alert/alert-06';
import Avatar23 from '@/registry/ndeko/components/avatar/avatar-23';
import Badge11 from '@/registry/ndeko/components/badge/badge-11';
import Banner09 from '@/registry/ndeko/components/banner/banner-09';
import Breadcrumb02 from '@/registry/ndeko/components/breadcrumb/breadcrumb-02';
import Button27 from '@/registry/ndeko/components/button/button-27';
import Button35 from '@/registry/ndeko/components/button/button-35';
import Button40 from '@/registry/ndeko/components/button/button-40';
import CalendarDatePicker02 from '@/registry/ndeko/components/calendar-date-picker/calendar-date-picker-02';
import Checkbox06 from '@/registry/ndeko/components/checkbox/checkbox-06';
import Comment03 from '@/registry/ndeko/components/comment/comment-03';
import Input25 from '@/registry/ndeko/components/input/input-25';
import Notification28 from '@/registry/ndeko/components/notification/notification-28';
import Pagination06 from '@/registry/ndeko/components/pagination/pagination-06';
import Popover02 from '@/registry/ndeko/components/popover/popover-02';
import Select34 from '@/registry/ndeko/components/select/select-34';
import Slider26 from '@/registry/ndeko/components/slider/slider-26';
import Switch12 from '@/registry/ndeko/components/switch/switch-12';
import Tabs14 from '@/registry/ndeko/components/tabs/tabs-14';
import Teams08 from '@/registry/ndeko/components/teams/teams-08';
import Timeline06 from '@/registry/ndeko/components/timeline/timeline-06';
import Tooltip07 from '@/registry/ndeko/components/tooltip/tooltip-07';
import Tooltip09 from '@/registry/ndeko/components/tooltip/tooltip-09';

/*
 * The real catalogue items the home page shows, by name, so a caption can link to each one.
 * They are the same files the shadcn command installs.
 */

export type ShowcasePiece = {
  name: string;
  Piece: ComponentType;
};

function pieceOf(name: string, Piece: ComponentType): ShowcasePiece {
  return { name, Piece };
}

/** The live composition the "Find it" step shows for each of the largest categories. */
export const PIECE_BY_CATEGORY: Record<string, ShowcasePiece> = {
  button: pieceOf('button-40', Button40),
  input: pieceOf('input-25', Input25),
  select: pieceOf('select-34', Select34),
  notification: pieceOf('notification-28', Notification28),
  'calendar-date-picker': pieceOf(
    'calendar-date-picker-02',
    CalendarDatePicker02
  ),
};

/** Two or three live compositions per family, for the families scroll. */
export const PIECES_BY_FAMILY: Record<string, ShowcasePiece[]> = {
  Actions: [
    pieceOf('button-40', Button40),
    pieceOf('button-27', Button27),
    pieceOf('button-35', Button35),
  ],
  Forms: [pieceOf('input-25', Input25), pieceOf('slider-26', Slider26)],
  Overlays: [
    pieceOf('tooltip-09', Tooltip09),
    pieceOf('tooltip-07', Tooltip07),
    pieceOf('popover-02', Popover02),
  ],
  Navigation: [
    pieceOf('tabs-14', Tabs14),
    pieceOf('pagination-06', Pagination06),
    pieceOf('breadcrumb-02', Breadcrumb02),
  ],
  'Data display': [
    pieceOf('avatar-23', Avatar23),
    pieceOf('badge-11', Badge11),
    pieceOf('timeline-06', Timeline06),
  ],
  Collaboration: [
    pieceOf('teams-08', Teams08),
    pieceOf('comment-03', Comment03),
  ],
  Feedback: [
    pieceOf('notification-28', Notification28),
    pieceOf('alert-06', Alert06),
    pieceOf('banner-09', Banner09),
  ],
};

/** The pieces the "motion" reason shows, each named by the micro-interaction it carries. */
export const MOTION_PIECES = [
  { motion: 'Travel', piece: pieceOf('button-35', Button35) },
  { motion: 'Strike', piece: pieceOf('checkbox-06', Checkbox06) },
  { motion: 'Slide', piece: pieceOf('switch-12', Switch12) },
];

/** The catalogue page of an item, anchored on its tile. */
export function pieceHrefOf(name: string) {
  const category = name.replace(/-\d+$/, '');
  return `/components/${category}#${name}`;
}
