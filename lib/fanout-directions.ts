import type { FanoutEdge, FanoutExitPosition } from "@tscircuit/fanout-solver"

export type MajorityDirection = "up" | "right" | "down" | "left"

export interface Am62lFanoutDirectionCase {
  id: string
  name: string
  description: string
  exitPosition: Exclude<FanoutExitPosition, "center">
  exitEdge: FanoutEdge
  majorityDirection: MajorityDirection
  bandShift: -1 | 0 | 1
}

export const FANOUT_DIRECTION_CASES = [
  {
    id: "01-top-left-offset",
    name: "Top · left offset",
    description: "Majority-up fanout using the left band of the top edge.",
    exitPosition: "topside_left",
    exitEdge: "top",
    majorityDirection: "up",
    bandShift: -1,
  },
  {
    id: "02-top-center",
    name: "Top · centered",
    description: "Majority-up fanout centered on the top edge.",
    exitPosition: "topside_center",
    exitEdge: "top",
    majorityDirection: "up",
    bandShift: 0,
  },
  {
    id: "03-top-right-offset",
    name: "Top · right offset",
    description: "Majority-up fanout using the right band of the top edge.",
    exitPosition: "topside_right",
    exitEdge: "top",
    majorityDirection: "up",
    bandShift: 1,
  },
  {
    id: "04-right-top-offset",
    name: "Right · top offset",
    description: "Majority-right fanout using the top band of the right edge.",
    exitPosition: "rightside_top",
    exitEdge: "right",
    majorityDirection: "right",
    bandShift: -1,
  },
  {
    id: "05-right-center",
    name: "Right · centered",
    description: "Majority-right fanout centered on the right edge.",
    exitPosition: "rightside_center",
    exitEdge: "right",
    majorityDirection: "right",
    bandShift: 0,
  },
  {
    id: "06-right-bottom-offset",
    name: "Right · bottom offset",
    description:
      "Majority-right fanout using the bottom band of the right edge.",
    exitPosition: "rightside_bottom",
    exitEdge: "right",
    majorityDirection: "right",
    bandShift: 1,
  },
  {
    id: "07-bottom-right-offset",
    name: "Bottom · right offset",
    description:
      "Majority-down fanout using the right band of the bottom edge.",
    exitPosition: "bottomside_right",
    exitEdge: "bottom",
    majorityDirection: "down",
    bandShift: -1,
  },
  {
    id: "08-bottom-center",
    name: "Bottom · centered",
    description: "Majority-down fanout centered on the bottom edge.",
    exitPosition: "bottomside_center",
    exitEdge: "bottom",
    majorityDirection: "down",
    bandShift: 0,
  },
  {
    id: "09-bottom-left-offset",
    name: "Bottom · left offset",
    description: "Majority-down fanout using the left band of the bottom edge.",
    exitPosition: "bottomside_left",
    exitEdge: "bottom",
    majorityDirection: "down",
    bandShift: 1,
  },
  {
    id: "10-left-bottom-offset",
    name: "Left · bottom offset",
    description: "Majority-left fanout using the bottom band of the left edge.",
    exitPosition: "leftside_bottom",
    exitEdge: "left",
    majorityDirection: "left",
    bandShift: -1,
  },
  {
    id: "11-left-center",
    name: "Left · centered",
    description: "Majority-left fanout centered on the left edge.",
    exitPosition: "leftside_center",
    exitEdge: "left",
    majorityDirection: "left",
    bandShift: 0,
  },
  {
    id: "12-left-top-offset",
    name: "Left · top offset",
    description: "Majority-left fanout using the top band of the left edge.",
    exitPosition: "leftside_top",
    exitEdge: "left",
    majorityDirection: "left",
    bandShift: 1,
  },
] as const satisfies readonly Am62lFanoutDirectionCase[]

export function getFanoutDirectionCase(
  exitPosition: Exclude<FanoutExitPosition, "center">,
): Am62lFanoutDirectionCase {
  const directionCase = FANOUT_DIRECTION_CASES.find(
    (candidate) => candidate.exitPosition === exitPosition,
  )
  if (!directionCase) {
    throw new Error(`Unknown AM62L fanout direction ${exitPosition}`)
  }
  return directionCase
}
