import type { FanoutDirection } from "@tscircuit/fanout-solver"
import { getAm62lPinNumber } from "./am62l-footprint"

export type DdrBusName =
  | "DDR_BYTE0"
  | "DDR_BYTE1"
  | "DDR_ADDR_CTRL"
  | "DDR_CLOCK"
  | "DDR_DQS0"
  | "DDR_DQS1"
  | "DDR_RESET"
  | "DDR_DMI0"
  | "DDR_DMI1"

export interface Am62lSignalConnection {
  busName: DdrBusName
  memoryBall: string
  memoryPinNumber: number
  memorySignal: string
  socBall: string
  socPinNumber: number
  socSignal: string
  traceName: string
}

// Copied from create-am62l-lpddr4-fanout.tsx in tscircuit/core. The DMI
// connections come from the RAM-above form of the same progressive fixture,
// making this dataset a superset of the seven-bus default repro.
const DDR_PIN_ASSIGNMENTS = [
  [0, 94, "F4", 12, "B2"],
  [1, 93, "F3", 22, "C2"],
  [2, 91, "F1", 42, "E2"],
  [3, 76, "E1", 52, "F2"],
  [4, 105, "G4", 54, "F4"],
  [5, 123, "H4", 44, "E4"],
  [6, 121, "H2", 24, "C4"],
  [7, 122, "H3", 14, "B4"],
  [8, 275, "V4", 19, "B11"],
  [9, 238, "T3", 29, "C11"],
  [10, 236, "T1", 49, "E11"],
  [11, 255, "U1", 59, "F11"],
  [12, 257, "U4", 57, "F9"],
  [13, 276, "V5", 47, "E9"],
  [14, 256, "U2", 27, "C9"],
  [15, 284, "W1", 17, "B9"],
] as const

const DDR_CONNECTIONS: readonly Am62lSignalConnection[] =
  DDR_PIN_ASSIGNMENTS.map(
    ([bit, socPinNumber, socBall, memoryPinNumber, memoryBall]) => ({
      busName: bit < 8 ? "DDR_BYTE0" : "DDR_BYTE1",
      memoryBall,
      memoryPinNumber,
      memorySignal: `DQ${bit}`,
      socBall,
      socPinNumber,
      socSignal: `DDR0_DQ${bit}`,
      traceName: `DQ${bit}`,
    }),
  )

const createConnections = (
  busName: DdrBusName,
  assignments: readonly (readonly [
    string,
    string,
    number,
    string,
    number,
    string,
  ])[],
): readonly Am62lSignalConnection[] =>
  assignments.map(
    ([
      traceName,
      socSignal,
      socPinNumber,
      socBall,
      memoryPinNumber,
      memoryBall,
    ]) => ({
      busName,
      memoryBall,
      memoryPinNumber,
      memorySignal: traceName,
      socBall,
      socPinNumber,
      socSignal,
      traceName,
    }),
  )

const DDR_ADDR_CTRL_CONNECTIONS = createConnections("DDR_ADDR_CTRL", [
  ["CA0", "DDR0_A0", 164, "L5", 72, "H2"],
  ["CA1", "DDR0_A1", 125, "H6", 82, "J2"],
  ["CA2", "DDR0_A2", 165, "L6", 77, "H9"],
  ["CA3", "DDR0_A3", 150, "K2", 78, "H10"],
  ["CA4", "DDR0_A4", 139, "J1", 79, "H11"],
  ["CA5", "DDR0_A5", 124, "H5", 89, "J11"],
  ["CS", "DDR0_CS0_n", 162, "L3", 74, "H4"],
  ["CKE", "DDR0_CKE0", 149, "K1", 84, "J4"],
] as const)

const DDR_CLOCK_CONNECTIONS = createConnections("DDR_CLOCK", [
  ["CK_t", "DDR0_CK0", 215, "P1", 86, "J8"],
  ["CK_c", "DDR0_CK0_n", 216, "P2", 87, "J9"],
] as const)

const DDR_DQS0_CONNECTIONS = createConnections("DDR_DQS0", [
  ["DQS0_t", "DDR0_DQS0", 103, "G1", 33, "D3"],
  ["DQS0_c", "DDR0_DQS0_n", 104, "G2", 43, "E3"],
] as const)

const DDR_DQS1_CONNECTIONS = createConnections("DDR_DQS1", [
  ["DQS1_t", "DDR0_DQS1", 272, "V1", 38, "D10"],
  ["DQS1_c", "DDR0_DQS1_n", 273, "V2", 48, "E10"],
] as const)

const singletonConnection = (
  busName: DdrBusName,
  traceName: string,
  socSignal: string,
  socPinNumber: number,
  socBall: string,
  memoryPinNumber: number,
  memoryBall: string,
): Am62lSignalConnection => ({
  busName,
  memoryBall,
  memoryPinNumber,
  memorySignal: traceName,
  socBall,
  socPinNumber,
  socSignal,
  traceName,
})

export const AM62L_SIGNAL_CONNECTIONS = [
  ...DDR_CONNECTIONS,
  ...DDR_ADDR_CTRL_CONNECTIONS,
  ...DDR_CLOCK_CONNECTIONS,
  ...DDR_DQS0_CONNECTIONS,
  ...DDR_DQS1_CONNECTIONS,
  singletonConnection(
    "DDR_RESET",
    "RESET_n",
    "DDR0_RESET0_n",
    140,
    "J2",
    139,
    "T11",
  ),
  singletonConnection("DDR_DMI0", "DMI0", "DDR0_DM0", 92, "F2", 23, "C3"),
  singletonConnection("DDR_DMI1", "DMI1", "DDR0_DM1", 285, "W2", 28, "C10"),
] as const satisfies readonly Am62lSignalConnection[]

export type BusBand = -1 | 0 | 1

export interface Am62lSignalBusDefinition {
  name: DdrBusName
  connections: readonly string[]
  preferredLayers: readonly string[]
  maxLengthSkew?: number
  baseBand: BusBand
}

const traceNamesFor = (busName: DdrBusName) =>
  AM62L_SIGNAL_CONNECTIONS.filter(
    (connection) => connection.busName === busName,
  ).map((connection) => connection.traceName)

export const AM62L_SIGNAL_BUSES = [
  {
    name: "DDR_BYTE0",
    connections: traceNamesFor("DDR_BYTE0"),
    preferredLayers: ["top", "inner4"],
    maxLengthSkew: 8,
    baseBand: -1,
  },
  {
    name: "DDR_BYTE1",
    connections: traceNamesFor("DDR_BYTE1"),
    preferredLayers: ["inner5", "bottom"],
    maxLengthSkew: 14.5,
    baseBand: 1,
  },
  {
    name: "DDR_ADDR_CTRL",
    connections: traceNamesFor("DDR_ADDR_CTRL"),
    preferredLayers: ["inner6"],
    maxLengthSkew: 15,
    baseBand: 0,
  },
  {
    name: "DDR_CLOCK",
    connections: traceNamesFor("DDR_CLOCK"),
    preferredLayers: ["inner5"],
    maxLengthSkew: 0.25,
    baseBand: -1,
  },
  {
    name: "DDR_DQS0",
    connections: traceNamesFor("DDR_DQS0"),
    preferredLayers: ["inner5"],
    maxLengthSkew: 0.25,
    baseBand: -1,
  },
  {
    name: "DDR_DQS1",
    connections: traceNamesFor("DDR_DQS1"),
    preferredLayers: ["inner5"],
    maxLengthSkew: 0.25,
    baseBand: 1,
  },
  {
    name: "DDR_RESET",
    connections: traceNamesFor("DDR_RESET"),
    preferredLayers: ["inner6"],
    baseBand: 0,
  },
  {
    name: "DDR_DMI0",
    connections: traceNamesFor("DDR_DMI0"),
    preferredLayers: ["inner5"],
    baseBand: -1,
  },
  {
    name: "DDR_DMI1",
    connections: traceNamesFor("DDR_DMI1"),
    preferredLayers: ["inner5"],
    baseBand: 1,
  },
] as const satisfies readonly Am62lSignalBusDefinition[]

export const AM62L_DIFFERENTIAL_PAIRS = [
  {
    name: "DDR_CLOCK_PAIR",
    positiveConnection: "CK_t",
    negativeConnection: "CK_c",
    lengthTolerance: 0.25,
  },
  {
    name: "DDR_DQS0_PAIR",
    positiveConnection: "DQS0_t",
    negativeConnection: "DQS0_c",
    lengthTolerance: 0.25,
  },
  {
    name: "DDR_DQS1_PAIR",
    positiveConnection: "DQS1_t",
    negativeConnection: "DQS1_c",
    lengthTolerance: 0.25,
  },
] as const

const parseBallList = (ballNames: string): readonly string[] =>
  ballNames.trim().split(/\s+/)

const AM62L_VSS_BALLS = parseBallList(`
  A1 A2 A4 A10 A13 A16 A19 A22 A23 B1 B5 B17 B20 B23 C12 C18 D1
  E2 E6 E8 E9 E10 E14 E15 F5 F6 F18 G7 G8 G9 G12 G15 G16 G17
  H1 H7 H14 H17 K8 K9 K15 L7 L9 L13 L16 L18 M1 M12 N7 N9 N11
  N13 N16 P9 P15 R1 R8 R13 R15 T2 T7 T8 T19 U7 U8 U10 U13 U14
  U15 U17 U20 V3 V18 V19 W9 W10 W12 W14 W15 W16 W18 Y1 Y20 Y21
  AA4 AA20 AB1 AB7 AB21 AB23 AC1 AC2 AC11 AC14 AC19 AC22 AC23
`)

const AM62L_VDDS_DDR_BALLS = ["L8", "M7", "M8", "N8", "P8"] as const

const PLANE_BALLS_BY_DIRECTION: Readonly<
  Record<FanoutDirection, ReadonlySet<string>>
> = {
  up: new Set(
    parseBallList(`
      A1 A2 A4 A10 A13 A16 A19 A22 A23 B5 B17 B20 C12 C18 E6 E8 E9 E10
      E14 E15 F6 F18 G7 G8 G9 G12 G15 G16 G17 H14 L13
    `),
  ),
  right: new Set(
    parseBallList(`B23 H17 K15 L16 L18 M12 N16 P15 T19 U20 V19 Y21 AB23`),
  ),
  down: new Set(
    parseBallList(`
      N11 N13 R13 R15 T8 U7 U8 U10 U13 U14 U15 U17 V18 W9 W10 W12 W14
      W15 W16 W18 Y20 AA4 AA20 AB7 AB21 AC1 AC2 AC11 AC14 AC19 AC22 AC23
    `),
  ),
  left: new Set(
    parseBallList(`
      B1 D1 E2 F5 H1 H7 K8 K9 L7 L9 M1 N7 N9 P9 R1 R8 T2 T7 V3 Y1 AB1
      L8 M7 M8 N8 P8
    `),
  ),
}

const getPlaneDirection = (ballName: string): FanoutDirection => {
  for (const direction of ["up", "right", "down", "left"] as const) {
    if (PLANE_BALLS_BY_DIRECTION[direction].has(ballName)) return direction
  }
  throw new Error(
    `Missing core plane-drop direction for AM62L ball ${ballName}`,
  )
}

export interface Am62lPlaneDrop {
  ballName: string
  direction: FanoutDirection
  layer: "inner1" | "inner2"
  netName: "GND" | "VDD_LPDDR4"
  pinNumber: number
  pinSignal: "VSS" | "VDDS_DDR"
  traceName: string
}

const createPlaneDrops = (
  ballNames: readonly string[],
  pinSignal: Am62lPlaneDrop["pinSignal"],
  netName: Am62lPlaneDrop["netName"],
  layer: Am62lPlaneDrop["layer"],
): readonly Am62lPlaneDrop[] =>
  ballNames.map((ballName) => ({
    ballName,
    direction: getPlaneDirection(ballName),
    layer,
    netName,
    pinNumber: getAm62lPinNumber(ballName),
    pinSignal,
    traceName: `U1_${pinSignal}_${ballName}_DROP`,
  }))

export const AM62L_PLANE_DROPS = [
  ...createPlaneDrops(AM62L_VSS_BALLS, "VSS", "GND", "inner1"),
  ...createPlaneDrops(AM62L_VDDS_DDR_BALLS, "VDDS_DDR", "VDD_LPDDR4", "inner2"),
] as const satisfies readonly Am62lPlaneDrop[]

if (AM62L_SIGNAL_CONNECTIONS.length !== 33) {
  throw new Error("The complete AM62L DDR fixture must contain 33 signals")
}
if (AM62L_PLANE_DROPS.length !== 102) {
  throw new Error("The complete AM62L SoC fixture must contain 102 plane drops")
}
