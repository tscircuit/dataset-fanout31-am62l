import {
  createSample as create01TopLeftOffset,
  exitPosition as exitPosition01,
} from "./01-top-left-offset"
import {
  createSample as create02TopCenter,
  exitPosition as exitPosition02,
} from "./02-top-center"
import {
  createSample as create03TopRightOffset,
  exitPosition as exitPosition03,
} from "./03-top-right-offset"
import {
  createSample as create04RightTopOffset,
  exitPosition as exitPosition04,
} from "./04-right-top-offset"
import {
  createSample as create05RightCenter,
  exitPosition as exitPosition05,
} from "./05-right-center"
import {
  createSample as create06RightBottomOffset,
  exitPosition as exitPosition06,
} from "./06-right-bottom-offset"
import {
  createSample as create07BottomRightOffset,
  exitPosition as exitPosition07,
} from "./07-bottom-right-offset"
import {
  createSample as create08BottomCenter,
  exitPosition as exitPosition08,
} from "./08-bottom-center"
import {
  createSample as create09BottomLeftOffset,
  exitPosition as exitPosition09,
} from "./09-bottom-left-offset"
import {
  createSample as create10LeftBottomOffset,
  exitPosition as exitPosition10,
} from "./10-left-bottom-offset"
import {
  createSample as create11LeftCenter,
  exitPosition as exitPosition11,
} from "./11-left-center"
import {
  createSample as create12LeftTopOffset,
  exitPosition as exitPosition12,
} from "./12-left-top-offset"

export const AM62L_SAMPLE_DEFINITIONS = [
  { exitPosition: exitPosition01, createSample: create01TopLeftOffset },
  { exitPosition: exitPosition02, createSample: create02TopCenter },
  { exitPosition: exitPosition03, createSample: create03TopRightOffset },
  { exitPosition: exitPosition04, createSample: create04RightTopOffset },
  { exitPosition: exitPosition05, createSample: create05RightCenter },
  { exitPosition: exitPosition06, createSample: create06RightBottomOffset },
  { exitPosition: exitPosition07, createSample: create07BottomRightOffset },
  { exitPosition: exitPosition08, createSample: create08BottomCenter },
  { exitPosition: exitPosition09, createSample: create09BottomLeftOffset },
  { exitPosition: exitPosition10, createSample: create10LeftBottomOffset },
  { exitPosition: exitPosition11, createSample: create11LeftCenter },
  { exitPosition: exitPosition12, createSample: create12LeftTopOffset },
] as const
