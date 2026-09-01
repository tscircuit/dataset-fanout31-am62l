import type { FanoutEdge, FanoutExitPosition } from "@tscircuit/fanout-solver"

export type MajorityDirection = "up" | "right" | "down" | "left"

export interface Am62lFanoutDirectionCase {
  id: string
  name: string
  description: string
  exitPosition: Exclude<FanoutExitPosition, "center">
  exitEdge: FanoutEdge
  majorityDirection: MajorityDirection
  bandCoordinate: number
  sourceBalls: readonly [string, string, string, string]
}

const TOP_BALLS = ["A10", "A11", "A12", "A13"] as const
const RIGHT_BALLS = ["J23", "K23", "L23", "M23"] as const
const BOTTOM_BALLS = ["AC10", "AC11", "AC12", "AC13"] as const
const LEFT_BALLS = ["J1", "K1", "L1", "M1"] as const

export const FANOUT_DIRECTION_CASES = [
  {
    id: "01-top-left-offset",
    name: "Top · left offset",
    description: "Majority-up fanout using the left band of the top edge.",
    exitPosition: "topside_left",
    exitEdge: "top",
    majorityDirection: "up",
    bandCoordinate: -4,
    sourceBalls: TOP_BALLS,
  },
  {
    id: "02-top-center",
    name: "Top · centered",
    description: "Majority-up fanout centered on the top edge.",
    exitPosition: "topside_center",
    exitEdge: "top",
    majorityDirection: "up",
    bandCoordinate: 0,
    sourceBalls: TOP_BALLS,
  },
  {
    id: "03-top-right-offset",
    name: "Top · right offset",
    description: "Majority-up fanout using the right band of the top edge.",
    exitPosition: "topside_right",
    exitEdge: "top",
    majorityDirection: "up",
    bandCoordinate: 4,
    sourceBalls: TOP_BALLS,
  },
  {
    id: "04-right-top-offset",
    name: "Right · top offset",
    description: "Majority-right fanout using the top band of the right edge.",
    exitPosition: "rightside_top",
    exitEdge: "right",
    majorityDirection: "right",
    bandCoordinate: 4,
    sourceBalls: RIGHT_BALLS,
  },
  {
    id: "05-right-center",
    name: "Right · centered",
    description: "Majority-right fanout centered on the right edge.",
    exitPosition: "rightside_center",
    exitEdge: "right",
    majorityDirection: "right",
    bandCoordinate: 0,
    sourceBalls: RIGHT_BALLS,
  },
  {
    id: "06-right-bottom-offset",
    name: "Right · bottom offset",
    description:
      "Majority-right fanout using the bottom band of the right edge.",
    exitPosition: "rightside_bottom",
    exitEdge: "right",
    majorityDirection: "right",
    bandCoordinate: -4,
    sourceBalls: RIGHT_BALLS,
  },
  {
    id: "07-bottom-right-offset",
    name: "Bottom · right offset",
    description:
      "Majority-down fanout using the right band of the bottom edge.",
    exitPosition: "bottomside_right",
    exitEdge: "bottom",
    majorityDirection: "down",
    bandCoordinate: 4,
    sourceBalls: BOTTOM_BALLS,
  },
  {
    id: "08-bottom-center",
    name: "Bottom · centered",
    description: "Majority-down fanout centered on the bottom edge.",
    exitPosition: "bottomside_center",
    exitEdge: "bottom",
    majorityDirection: "down",
    bandCoordinate: 0,
    sourceBalls: BOTTOM_BALLS,
  },
  {
    id: "09-bottom-left-offset",
    name: "Bottom · left offset",
    description: "Majority-down fanout using the left band of the bottom edge.",
    exitPosition: "bottomside_left",
    exitEdge: "bottom",
    majorityDirection: "down",
    bandCoordinate: -4,
    sourceBalls: BOTTOM_BALLS,
  },
  {
    id: "10-left-bottom-offset",
    name: "Left · bottom offset",
    description: "Majority-left fanout using the bottom band of the left edge.",
    exitPosition: "leftside_bottom",
    exitEdge: "left",
    majorityDirection: "left",
    bandCoordinate: -4,
    sourceBalls: LEFT_BALLS,
  },
  {
    id: "11-left-center",
    name: "Left · centered",
    description: "Majority-left fanout centered on the left edge.",
    exitPosition: "leftside_center",
    exitEdge: "left",
    majorityDirection: "left",
    bandCoordinate: 0,
    sourceBalls: LEFT_BALLS,
  },
  {
    id: "12-left-top-offset",
    name: "Left · top offset",
    description: "Majority-left fanout using the top band of the left edge.",
    exitPosition: "leftside_top",
    exitEdge: "left",
    majorityDirection: "left",
    bandCoordinate: 4,
    sourceBalls: LEFT_BALLS,
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
