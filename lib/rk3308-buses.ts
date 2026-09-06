import { DDR3L_SIGNAL_BALLS, getDdr3lPinNumber } from "./ddr3l-footprint"
import {
  RK3308_DDR_SIGNAL_BALL_MAP,
  RK3308_DDR_VDD_BALL_NAMES,
  RK3308_VSS_BALL_NAMES,
} from "./rk3308-ball-map"
import { getRk3308PinNumber } from "./rk3308-footprint"

export type Rk3308DdrBusName =
  | "DDR_BYTE0"
  | "DDR_BYTE1"
  | "DDR_ADDR_CTRL"
  | "DDR_CLOCK"
  | "DDR_DQS0"
  | "DDR_DQS1"
  | "DDR_RESET"
  | "DDR_DM0"
  | "DDR_DM1"

type MemorySignal = keyof typeof DDR3L_SIGNAL_BALLS
export interface Rk3308SignalConnection {
  busName: Rk3308DdrBusName
  traceName: string
  socSignal: string
  socBall: string
  socPinNumber: number
  memorySignal: MemorySignal
  memoryBall: string
  memoryPinNumber: number
}

const socBallBySignal = new Map(
  Object.entries(RK3308_DDR_SIGNAL_BALL_MAP).map(([ball, signal]) => [
    signal,
    ball,
  ]),
)
const connect = (
  busName: Rk3308DdrBusName,
  socSignal: string,
  memorySignal: MemorySignal,
): Rk3308SignalConnection => {
  const socBall = socBallBySignal.get(socSignal)
  const memoryBall = DDR3L_SIGNAL_BALLS[memorySignal]
  if (!socBall || !memoryBall)
    throw new Error(
      `Missing DDR ball mapping for ${socSignal} / ${memorySignal}`,
    )
  return {
    busName,
    traceName: memorySignal,
    socSignal,
    socBall,
    socPinNumber: getRk3308PinNumber(socBall),
    memorySignal,
    memoryBall,
    memoryPinNumber: getDdr3lPinNumber(memoryBall),
  }
}

// Direct logical mapping, with no byte or address swaps. Ball assignments come
// from the Rockchip/Samsung pin tables cited in the two footprint modules.
export const RK3308_SIGNAL_CONNECTIONS: readonly Rk3308SignalConnection[] = [
  ...Array.from({ length: 16 }, (_, bit) =>
    connect(
      bit < 8 ? "DDR_BYTE0" : "DDR_BYTE1",
      `DDR_DQ${bit}`,
      `DQ${bit}` as MemorySignal,
    ),
  ),
  ...Array.from({ length: 15 }, (_, bit) =>
    connect("DDR_ADDR_CTRL", `DDR_A${bit}`, `A${bit}` as MemorySignal),
  ),
  ...Array.from({ length: 3 }, (_, bit) =>
    connect("DDR_ADDR_CTRL", `DDR_BA${bit}`, `BA${bit}` as MemorySignal),
  ),
  connect("DDR_ADDR_CTRL", "DDR_CS0N", "CS_N"),
  connect("DDR_ADDR_CTRL", "DDR_CKE", "CKE"),
  connect("DDR_ADDR_CTRL", "DDR_ODT0", "ODT"),
  connect("DDR_ADDR_CTRL", "DDR_RASN", "RAS_N"),
  connect("DDR_ADDR_CTRL", "DDR_CASN", "CAS_N"),
  connect("DDR_ADDR_CTRL", "DDR_WEN", "WE_N"),
  connect("DDR_CLOCK", "DDR_CLK", "CK"),
  connect("DDR_CLOCK", "DDR_CLKN", "CK_N"),
  connect("DDR_DQS0", "DDR_DQS0", "DQS0"),
  connect("DDR_DQS0", "DDR_DQS0N", "DQS0_N"),
  connect("DDR_DQS1", "DDR_DQS1", "DQS1"),
  connect("DDR_DQS1", "DDR_DQS1N", "DQS1_N"),
  connect("DDR_RESET", "DDR_RESET", "RESET_N"),
  connect("DDR_DM0", "DDR_DM0", "DM0"),
  connect("DDR_DM1", "DDR_DM1", "DM1"),
]

interface Rk3308SignalBus {
  name: Rk3308DdrBusName
  connections: readonly string[]
  preferredLayers: readonly (
    | "top"
    | "inner4"
    | "inner5"
    | "inner6"
    | "bottom"
  )[]
  maxLengthSkew?: number
  baseBand: -1 | 0 | 1
}
const traceNamesFor = (name: Rk3308DdrBusName) =>
  RK3308_SIGNAL_CONNECTIONS.filter(
    (connection) => connection.busName === name,
  ).map((connection) => connection.traceName)

// These are explicit fanout benchmark budgets, not board-level DDR timing
// signoff limits. The stackup and routing layers match the AM62L sample family.
const busRules: readonly Omit<Rk3308SignalBus, "connections">[] = [
  {
    name: "DDR_BYTE0",
    preferredLayers: ["top", "inner4"],
    maxLengthSkew: 8,
    baseBand: -1,
  },
  {
    name: "DDR_BYTE1",
    preferredLayers: ["inner5", "bottom"],
    maxLengthSkew: 8,
    baseBand: 1,
  },
  {
    name: "DDR_ADDR_CTRL",
    preferredLayers: ["inner6"],
    maxLengthSkew: 15,
    baseBand: 0,
  },
  {
    name: "DDR_CLOCK",
    preferredLayers: ["inner5"],
    maxLengthSkew: 0.25,
    baseBand: -1,
  },
  {
    name: "DDR_DQS0",
    preferredLayers: ["inner5"],
    maxLengthSkew: 0.25,
    baseBand: -1,
  },
  {
    name: "DDR_DQS1",
    preferredLayers: ["inner5"],
    maxLengthSkew: 0.25,
    baseBand: 1,
  },
  { name: "DDR_RESET", preferredLayers: ["inner6"], baseBand: 0 },
  { name: "DDR_DM0", preferredLayers: ["inner5"], baseBand: -1 },
  { name: "DDR_DM1", preferredLayers: ["inner5"], baseBand: 1 },
]

export const RK3308_SIGNAL_BUSES: readonly Rk3308SignalBus[] = busRules.map(
  (bus) => ({ ...bus, connections: traceNamesFor(bus.name) }),
)

export const RK3308_DIFFERENTIAL_PAIRS = [
  {
    name: "DDR_CLOCK_PAIR",
    positiveConnection: "CK",
    negativeConnection: "CK_N",
    lengthTolerance: 0.25,
  },
  {
    name: "DDR_DQS0_PAIR",
    positiveConnection: "DQS0",
    negativeConnection: "DQS0_N",
    lengthTolerance: 0.25,
  },
  {
    name: "DDR_DQS1_PAIR",
    positiveConnection: "DQS1",
    negativeConnection: "DQS1_N",
    lengthTolerance: 0.25,
  },
] as const

const planeDrops = (
  ballNames: readonly string[],
  pinSignal: "VSS" | "DDR_VDD",
  netName: "GND" | "VDD_DDR3L",
  layer: "inner1" | "inner2",
) =>
  ballNames.map((ballName) => ({
    ballName,
    pinNumber: getRk3308PinNumber(ballName),
    pinSignal,
    netName,
    layer,
    traceName: `U1_${pinSignal}_${ballName}_DROP`,
  }))

export const RK3308_PLANE_DROPS = [
  ...planeDrops(RK3308_VSS_BALL_NAMES, "VSS", "GND", "inner1"),
  ...planeDrops(RK3308_DDR_VDD_BALL_NAMES, "DDR_VDD", "VDD_DDR3L", "inner2"),
]

if (
  RK3308_SIGNAL_CONNECTIONS.length !== 49 ||
  RK3308_PLANE_DROPS.length !== 113
)
  throw new Error(
    "RK3308 must retain all 49 DDR signals and 113 digital plane drops",
  )
