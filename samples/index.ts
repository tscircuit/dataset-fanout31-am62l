import { getFanoutDirectionCase } from "../lib/fanout-directions"
import { getK230FanoutDirectionCase } from "../lib/k230-fanout-directions"
import { getRk3308FanoutDirectionCase } from "../lib/rk3308-fanout-directions"
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
import {
  createSample as create13Rk3308TopLeftOffset,
  exitPosition as exitPosition13,
} from "./13-rk3308-top-left-offset"
import {
  createSample as create14Rk3308TopCenter,
  exitPosition as exitPosition14,
} from "./14-rk3308-top-center"
import {
  createSample as create15Rk3308TopRightOffset,
  exitPosition as exitPosition15,
} from "./15-rk3308-top-right-offset"
import {
  createSample as create16Rk3308RightTopOffset,
  exitPosition as exitPosition16,
} from "./16-rk3308-right-top-offset"
import {
  createSample as create17Rk3308RightCenter,
  exitPosition as exitPosition17,
} from "./17-rk3308-right-center"
import {
  createSample as create18Rk3308RightBottomOffset,
  exitPosition as exitPosition18,
} from "./18-rk3308-right-bottom-offset"
import {
  createSample as create19Rk3308BottomRightOffset,
  exitPosition as exitPosition19,
} from "./19-rk3308-bottom-right-offset"
import {
  createSample as create20Rk3308BottomCenter,
  exitPosition as exitPosition20,
} from "./20-rk3308-bottom-center"
import {
  createSample as create21Rk3308BottomLeftOffset,
  exitPosition as exitPosition21,
} from "./21-rk3308-bottom-left-offset"
import {
  createSample as create22Rk3308LeftBottomOffset,
  exitPosition as exitPosition22,
} from "./22-rk3308-left-bottom-offset"
import {
  createSample as create23Rk3308LeftCenter,
  exitPosition as exitPosition23,
} from "./23-rk3308-left-center"
import {
  createSample as create24Rk3308LeftTopOffset,
  exitPosition as exitPosition24,
} from "./24-rk3308-left-top-offset"
import {
  createSample as create25K230TopLeftOffset,
  exitPosition as exitPosition25,
} from "./25-k230-top-left-offset"
import {
  createSample as create26K230TopCenter,
  exitPosition as exitPosition26,
} from "./26-k230-top-center"
import {
  createSample as create27K230TopRightOffset,
  exitPosition as exitPosition27,
} from "./27-k230-top-right-offset"
import {
  createSample as create28K230RightTopOffset,
  exitPosition as exitPosition28,
} from "./28-k230-right-top-offset"
import {
  createSample as create29K230RightCenter,
  exitPosition as exitPosition29,
} from "./29-k230-right-center"
import {
  createSample as create30K230RightBottomOffset,
  exitPosition as exitPosition30,
} from "./30-k230-right-bottom-offset"
import {
  createSample as create31K230BottomRightOffset,
  exitPosition as exitPosition31,
} from "./31-k230-bottom-right-offset"
import {
  createSample as create32K230BottomCenter,
  exitPosition as exitPosition32,
} from "./32-k230-bottom-center"
import {
  createSample as create33K230BottomLeftOffset,
  exitPosition as exitPosition33,
} from "./33-k230-bottom-left-offset"
import {
  createSample as create34K230LeftBottomOffset,
  exitPosition as exitPosition34,
} from "./34-k230-left-bottom-offset"
import {
  createSample as create35K230LeftCenter,
  exitPosition as exitPosition35,
} from "./35-k230-left-center"
import {
  createSample as create36K230LeftTopOffset,
  exitPosition as exitPosition36,
} from "./36-k230-left-top-offset"

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

export const RK3308_SAMPLE_DEFINITIONS = [
  { exitPosition: exitPosition13, createSample: create13Rk3308TopLeftOffset },
  { exitPosition: exitPosition14, createSample: create14Rk3308TopCenter },
  { exitPosition: exitPosition15, createSample: create15Rk3308TopRightOffset },
  { exitPosition: exitPosition16, createSample: create16Rk3308RightTopOffset },
  { exitPosition: exitPosition17, createSample: create17Rk3308RightCenter },
  {
    exitPosition: exitPosition18,
    createSample: create18Rk3308RightBottomOffset,
  },
  {
    exitPosition: exitPosition19,
    createSample: create19Rk3308BottomRightOffset,
  },
  { exitPosition: exitPosition20, createSample: create20Rk3308BottomCenter },
  {
    exitPosition: exitPosition21,
    createSample: create21Rk3308BottomLeftOffset,
  },
  {
    exitPosition: exitPosition22,
    createSample: create22Rk3308LeftBottomOffset,
  },
  { exitPosition: exitPosition23, createSample: create23Rk3308LeftCenter },
  { exitPosition: exitPosition24, createSample: create24Rk3308LeftTopOffset },
] as const

export const K230_SAMPLE_DEFINITIONS = [
  { exitPosition: exitPosition25, createSample: create25K230TopLeftOffset },
  { exitPosition: exitPosition26, createSample: create26K230TopCenter },
  { exitPosition: exitPosition27, createSample: create27K230TopRightOffset },
  { exitPosition: exitPosition28, createSample: create28K230RightTopOffset },
  { exitPosition: exitPosition29, createSample: create29K230RightCenter },
  { exitPosition: exitPosition30, createSample: create30K230RightBottomOffset },
  { exitPosition: exitPosition31, createSample: create31K230BottomRightOffset },
  { exitPosition: exitPosition32, createSample: create32K230BottomCenter },
  { exitPosition: exitPosition33, createSample: create33K230BottomLeftOffset },
  { exitPosition: exitPosition34, createSample: create34K230LeftBottomOffset },
  { exitPosition: exitPosition35, createSample: create35K230LeftCenter },
  { exitPosition: exitPosition36, createSample: create36K230LeftTopOffset },
] as const

export const FANOUT_SAMPLE_DEFINITIONS = [
  ...AM62L_SAMPLE_DEFINITIONS.map((definition) => ({
    ...definition,
    id: getFanoutDirectionCase(definition.exitPosition).id,
    chip: "am62l" as const,
  })),
  ...RK3308_SAMPLE_DEFINITIONS.map((definition) => ({
    ...definition,
    id: getRk3308FanoutDirectionCase(definition.exitPosition).id,
    chip: "rk3308" as const,
  })),
  ...K230_SAMPLE_DEFINITIONS.map((definition) => ({
    ...definition,
    id: getK230FanoutDirectionCase(definition.exitPosition).id,
    chip: "k230" as const,
  })),
] as const

export type FanoutSampleDefinition = (typeof FANOUT_SAMPLE_DEFINITIONS)[number]
export type FanoutChip = FanoutSampleDefinition["chip"]
