import type { FanoutExitPosition } from "@tscircuit/fanout-solver"
import { AM62L_DDR4_CONNECTIONS } from "./am62l-ddr4-connections"

type SignalLayer =
  | "top"
  | "inner3"
  | "inner4"
  | "inner5"
  | "inner6"
  | "inner7"
  | "inner8"
  | "bottom"

export interface Am62lDdr4Bus {
  name: string
  connections: readonly string[]
  allowedLayers: readonly SignalLayer[]
  preferredLayers: readonly SignalLayer[]
  exitPosition: Exclude<FanoutExitPosition, "center">
  maxLengthSkew?: number
}

const names = (...connectionNames: string[]) => connectionNames
const byte = (start: number) =>
  Array.from({ length: 8 }, (_, index) => `DDR_DQ${start + index}`)

// Keep each group atomic. Address/control is split only at physically adjacent
// AM62L escape channels; no multi-wire group is decomposed into singletons.
export const AM62L_DDR4_PROCESSOR_BUSES = [
  {
    name: "DDR_BYTE0",
    connections: byte(0),
    allowedLayers: ["top", "inner4"],
    preferredLayers: ["top", "inner4"],
    exitPosition: "leftside_top",
    maxLengthSkew: 8,
  },
  {
    name: "DDR_BYTE1",
    connections: byte(8),
    allowedLayers: ["inner5", "bottom"],
    preferredLayers: ["inner5", "bottom"],
    exitPosition: "leftside_bottom",
    maxLengthSkew: 14.5,
  },
  {
    name: "DDR_LANE1_STROBE_MASK",
    connections: names("DDR_DQS1_P", "DDR_DQS1_N", "DDR_DM1"),
    allowedLayers: ["inner5"],
    preferredLayers: ["inner5"],
    exitPosition: "leftside_bottom",
    maxLengthSkew: 2,
  },
  {
    name: "DDR_DQS0",
    connections: names("DDR_DQS0_P", "DDR_DQS0_N"),
    allowedLayers: ["inner5"],
    preferredLayers: ["inner5"],
    exitPosition: "leftside_top",
    maxLengthSkew: 0.05,
  },
  {
    name: "DDR_DM0",
    connections: names("DDR_DM0"),
    allowedLayers: ["inner5"],
    preferredLayers: ["inner5"],
    exitPosition: "leftside_top",
  },
  {
    name: "DDR_CLOCK",
    connections: names("DDR_CK_P", "DDR_CK_N"),
    allowedLayers: ["inner5"],
    preferredLayers: ["inner5"],
    exitPosition: "leftside_center",
    maxLengthSkew: 0.05,
  },
  {
    name: "DDR_RESET",
    connections: names("DDR_RESET_N"),
    allowedLayers: ["inner3"],
    preferredLayers: ["inner3"],
    exitPosition: "leftside_center",
  },
  {
    name: "DDR_ADDR_SOUTH_1A",
    connections: names("DDR_A8"),
    allowedLayers: ["inner3"],
    preferredLayers: ["inner3"],
    exitPosition: "leftside_center",
  },
  {
    name: "DDR_ADDR_SOUTH_1B",
    connections: names("DDR_A10"),
    allowedLayers: ["inner6"],
    preferredLayers: ["inner6"],
    exitPosition: "leftside_center",
  },
  {
    name: "DDR_ADDR_SOUTH_2",
    connections: names("DDR_A11", "DDR_A13"),
    allowedLayers: ["inner7"],
    preferredLayers: ["inner7"],
    exitPosition: "leftside_center",
    maxLengthSkew: 15,
  },
  {
    name: "DDR_ADDR_SOUTH_3",
    connections: names("DDR_A12"),
    allowedLayers: ["inner8"],
    preferredLayers: ["inner8"],
    exitPosition: "leftside_center",
  },
  {
    name: "DDR_ADDR_SOUTH_MID_1",
    connections: names("DDR_A6", "DDR_BA1"),
    allowedLayers: ["inner8"],
    preferredLayers: ["inner8"],
    exitPosition: "leftside_center",
    maxLengthSkew: 15,
  },
  {
    name: "DDR_ADDR_SOUTH_MID_2",
    connections: names("DDR_A7", "DDR_BG0"),
    allowedLayers: ["inner6"],
    preferredLayers: ["inner6"],
    exitPosition: "leftside_center",
    maxLengthSkew: 15,
  },
  {
    name: "DDR_ADDR_SOUTH_MID_3",
    connections: names("DDR_A9", "DDR_BA0"),
    allowedLayers: ["inner7"],
    preferredLayers: ["inner7"],
    exitPosition: "leftside_center",
    maxLengthSkew: 15,
  },
  {
    name: "DDR_ADDR_NORTH_1A",
    connections: names("DDR_A0"),
    allowedLayers: ["inner8"],
    preferredLayers: ["inner8"],
    exitPosition: "leftside_center",
  },
  {
    name: "DDR_ADDR_NORTH_1B",
    connections: names("DDR_A2"),
    allowedLayers: ["inner3"],
    preferredLayers: ["inner3"],
    exitPosition: "leftside_center",
  },
  {
    name: "DDR_ADDR_NORTH_2",
    connections: names("DDR_A1", "DDR_A5"),
    allowedLayers: ["inner6"],
    preferredLayers: ["inner6"],
    exitPosition: "leftside_center",
    maxLengthSkew: 15,
  },
  {
    name: "DDR_ADDR_NORTH_3",
    connections: names("DDR_A3", "DDR_CKE"),
    allowedLayers: ["inner7"],
    preferredLayers: ["inner7"],
    exitPosition: "leftside_center",
    maxLengthSkew: 15,
  },
  {
    name: "DDR_ADDR_NORTH_4",
    connections: names("DDR_A4", "DDR_CAS_n"),
    allowedLayers: ["inner3"],
    preferredLayers: ["inner3"],
    exitPosition: "leftside_center",
    maxLengthSkew: 15,
  },
  {
    name: "DDR_ADDR_NORTH_5A",
    connections: names("DDR_ACT_n"),
    allowedLayers: ["inner3"],
    preferredLayers: ["inner3"],
    exitPosition: "leftside_center",
  },
  {
    name: "DDR_ADDR_NORTH_5B",
    connections: names("DDR_WE_n"),
    allowedLayers: ["inner6"],
    preferredLayers: ["inner6"],
    exitPosition: "leftside_center",
  },
  {
    name: "DDR_ADDR_NORTH_6",
    connections: names("DDR_RAS_n", "DDR_ODT"),
    allowedLayers: ["inner7"],
    preferredLayers: ["inner7"],
    exitPosition: "leftside_center",
    maxLengthSkew: 15,
  },
  {
    name: "DDR_ADDR_NORTH_7",
    connections: names("DDR_CS_n"),
    allowedLayers: ["inner8"],
    preferredLayers: ["inner8"],
    exitPosition: "leftside_center",
  },
] as const satisfies readonly Am62lDdr4Bus[]

export const AM62L_DDR4_MEMORY_BUSES = AM62L_DDR4_PROCESSOR_BUSES.map(
  (bus) => ({
    ...bus,
    exitPosition: bus.exitPosition.replace(
      "leftside_",
      "rightside_",
    ) as Exclude<FanoutExitPosition, "center">,
  }),
)

const routedNames = new Set(
  AM62L_DDR4_PROCESSOR_BUSES.flatMap((bus) => bus.connections),
)
if (
  routedNames.size !== AM62L_DDR4_CONNECTIONS.length ||
  AM62L_DDR4_CONNECTIONS.some(({ name }) => !routedNames.has(name))
) {
  throw new Error("AM62L DDR4 bus definitions must cover every connection once")
}
