import { DDR3L_SIGNAL_BALLS, getDdr3lPinNumber } from "./ddr3l-footprint"
import {
  IMX6ULL_DDR_SIGNAL_BALL_MAP,
  IMX6ULL_DDR_VDD_BALL_NAMES,
  IMX6ULL_VSS_BALL_NAMES,
} from "./imx6ull-ball-map"
import { getImx6ullPinNumber } from "./imx6ull-footprint"

export type Imx6ullDdrBusName =
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
export interface Imx6ullSignalConnection {
  busName: Imx6ullDdrBusName
  traceName: string
  socSignal: string
  socBall: string
  socPinNumber: number
  memorySignal: MemorySignal
  memoryBall: string
  memoryPinNumber: number
}

const socBallBySignal = new Map(
  Object.entries(IMX6ULL_DDR_SIGNAL_BALL_MAP).map(([ball, signal]) => [
    signal,
    ball,
  ]),
)
const connect = (
  busName: Imx6ullDdrBusName,
  socSignal: string,
  memorySignal: MemorySignal,
): Imx6ullSignalConnection => {
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
    socPinNumber: getImx6ullPinNumber(socBall),
    memorySignal,
    memoryBall,
    memoryPinNumber: getDdr3lPinNumber(memoryBall),
  }
}

// Direct logical mapping, with no byte or address swaps. Ball assignments come
// from the NXP/Samsung pin tables cited in the two footprint modules.
export const IMX6ULL_SIGNAL_CONNECTIONS: readonly Imx6ullSignalConnection[] = [
  ...Array.from({ length: 16 }, (_, bit) =>
    connect(
      bit < 8 ? "DDR_BYTE0" : "DDR_BYTE1",
      `DRAM_DATA${String(bit).padStart(2, "0")}`,
      `DQ${bit}` as MemorySignal,
    ),
  ),
  ...Array.from({ length: 15 }, (_, bit) =>
    connect(
      "DDR_ADDR_CTRL",
      `DRAM_ADDR${String(bit).padStart(2, "0")}`,
      `A${bit}` as MemorySignal,
    ),
  ),
  ...Array.from({ length: 3 }, (_, bit) =>
    connect("DDR_ADDR_CTRL", `DRAM_SDBA${bit}`, `BA${bit}` as MemorySignal),
  ),
  connect("DDR_ADDR_CTRL", "DRAM_CS0_B", "CS_N"),
  connect("DDR_ADDR_CTRL", "DRAM_SDCKE0", "CKE"),
  connect("DDR_ADDR_CTRL", "DRAM_ODT0", "ODT"),
  connect("DDR_ADDR_CTRL", "DRAM_RAS_B", "RAS_N"),
  connect("DDR_ADDR_CTRL", "DRAM_CAS_B", "CAS_N"),
  connect("DDR_ADDR_CTRL", "DRAM_SDWE_B", "WE_N"),
  connect("DDR_CLOCK", "DRAM_SDCLK0_P", "CK"),
  connect("DDR_CLOCK", "DRAM_SDCLK0_N", "CK_N"),
  connect("DDR_DQS0", "DRAM_SDQS0_P", "DQS0"),
  connect("DDR_DQS0", "DRAM_SDQS0_N", "DQS0_N"),
  connect("DDR_DQS1", "DRAM_SDQS1_P", "DQS1"),
  connect("DDR_DQS1", "DRAM_SDQS1_N", "DQS1_N"),
  connect("DDR_RESET", "DRAM_RESET", "RESET_N"),
  connect("DDR_DM0", "DRAM_DQM0", "DM0"),
  connect("DDR_DM1", "DRAM_DQM1", "DM1"),
]

interface Imx6ullSignalBus {
  name: Imx6ullDdrBusName
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
const traceNamesFor = (name: Imx6ullDdrBusName) =>
  IMX6ULL_SIGNAL_CONNECTIONS.filter(
    (connection) => connection.busName === name,
  ).map((connection) => connection.traceName)

// These are explicit fanout benchmark budgets, not board-level DDR timing
// signoff limits. The stackup and routing layers match the AM62L sample family.
const busRules: readonly Omit<Imx6ullSignalBus, "connections">[] = [
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

export const IMX6ULL_SIGNAL_BUSES: readonly Imx6ullSignalBus[] = busRules.map(
  (bus) => ({ ...bus, connections: traceNamesFor(bus.name) }),
)

export const IMX6ULL_DIFFERENTIAL_PAIRS = [
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
  pinSignal: "VSS" | "NVCC_DRAM",
  netName: "GND" | "VDD_DDR3L",
  layer: "inner1" | "inner2",
) =>
  ballNames.map((ballName) => ({
    ballName,
    pinNumber: getImx6ullPinNumber(ballName),
    pinSignal,
    netName,
    layer,
    traceName: `U1_${pinSignal}_${ballName}_DROP`,
  }))

export const IMX6ULL_PLANE_DROPS = [
  ...planeDrops(IMX6ULL_VSS_BALL_NAMES, "VSS", "GND", "inner1"),
  ...planeDrops(IMX6ULL_DDR_VDD_BALL_NAMES, "NVCC_DRAM", "VDD_DDR3L", "inner2"),
]

if (
  IMX6ULL_SIGNAL_CONNECTIONS.length !== 49 ||
  IMX6ULL_PLANE_DROPS.length !== 53
)
  throw new Error(
    "IMX6ULL must retain all 49 DDR signals and 53 digital plane drops",
  )
