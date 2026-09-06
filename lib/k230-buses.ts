import {
  K230_DDR_IO_BALL_NAMES,
  K230_LPDDR4_SIGNAL_BALL_MAP,
  K230_VSS_BALL_NAMES,
} from "./k230-ball-map"
import { getK230PinNumber } from "./k230-footprint"
import {
  K230_LPDDR4_SIGNAL_BALLS,
  getK230Lpddr4PinNumber,
} from "./k230-lpddr4-footprint"

export type K230MemoryChannel = "A" | "B"
export type K230DdrBusName =
  | `LP4_${K230MemoryChannel}_${"BYTE0" | "BYTE1" | "CA_CTRL" | "CLOCK" | "DQS0" | "DQS1" | "DMI0" | "DMI1"}`
  | "LP4_RESET"
type MemorySignal = keyof typeof K230_LPDDR4_SIGNAL_BALLS

export interface K230MemoryEndpoint {
  channel: K230MemoryChannel
  componentName: "U2" | "U3"
  signal: MemorySignal
  ball: string
  pinNumber: number
}
export interface K230SignalConnection {
  busName: K230DdrBusName
  traceName: string
  socSignal: string
  socBall: string
  socPinNumber: number
  memoryEndpoints: readonly K230MemoryEndpoint[]
}
const socBallBySignal = new Map(
  Object.entries(K230_LPDDR4_SIGNAL_BALL_MAP).map(([ball, signal]) => [
    signal,
    ball,
  ]),
)
const memoryEndpoint = (
  channel: K230MemoryChannel,
  signal: MemorySignal,
): K230MemoryEndpoint => {
  const ball = K230_LPDDR4_SIGNAL_BALLS[signal]
  return {
    channel,
    componentName: channel === "A" ? "U2" : "U3",
    signal,
    ball,
    pinNumber: getK230Lpddr4PinNumber(ball),
  }
}
const connect = (
  busName: K230DdrBusName,
  socSignal: string,
  memoryEndpoints: readonly K230MemoryEndpoint[],
): K230SignalConnection => {
  const socBall = socBallBySignal.get(socSignal)
  if (!socBall) throw new Error(`Missing K230 LPDDR4 function ${socSignal}`)
  return {
    busName,
    traceName: `LP4_${socSignal}`,
    socSignal,
    socBall,
    socPinNumber: getK230PinNumber(socBall),
    memoryEndpoints,
  }
}

// Use the corrected LPDDR4 aliases from Canaan's 2024 pinout, rather than
// the LPDDR3 functions in the same pad names. No byte or address swaps.
export const K230_SIGNAL_CONNECTIONS: readonly K230SignalConnection[] = [
  ...(["A", "B"] as const).flatMap((channel) => [
    ...Array.from({ length: 16 }, (_, bit) =>
      connect(`LP4_${channel}_BYTE${bit < 8 ? 0 : 1}`, `DQ${channel}${bit}`, [
        memoryEndpoint(channel, `DQ${bit}` as MemorySignal),
      ]),
    ),
    ...Array.from({ length: 6 }, (_, bit) =>
      connect(`LP4_${channel}_CA_CTRL`, `CA${channel}${bit}`, [
        memoryEndpoint(channel, `CA${bit}` as MemorySignal),
      ]),
    ),
    connect(`LP4_${channel}_CA_CTRL`, `CS${channel}0`, [
      memoryEndpoint(channel, "CS0"),
    ]),
    connect(`LP4_${channel}_CA_CTRL`, `CKE${channel}0`, [
      memoryEndpoint(channel, "CKE0"),
    ]),
    connect(`LP4_${channel}_CLOCK`, `CLK${channel}P`, [
      memoryEndpoint(channel, "CK"),
    ]),
    connect(`LP4_${channel}_CLOCK`, `CLK${channel}N`, [
      memoryEndpoint(channel, "CK_N"),
    ]),
    ...([0, 1] as const).flatMap((byte) => [
      connect(`LP4_${channel}_DQS${byte}`, `DQS${channel}${byte}P`, [
        memoryEndpoint(channel, `DQS${byte}`),
      ]),
      connect(`LP4_${channel}_DQS${byte}`, `DQS${channel}${byte}N`, [
        memoryEndpoint(channel, `DQS${byte}_N`),
      ]),
      connect(`LP4_${channel}_DMI${byte}`, `DMI${channel}${byte}`, [
        memoryEndpoint(channel, `DMI${byte}`),
      ]),
    ]),
  ]),
  // One physical SoC reset output drives both single-rank x16 RAMs.
  connect("LP4_RESET", "RESET_N", [
    memoryEndpoint("A", "RESET_N"),
    memoryEndpoint("B", "RESET_N"),
  ]),
]

interface K230SignalBus {
  name: K230DdrBusName
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
const rules: readonly Omit<K230SignalBus, "connections">[] = [
  ...(["A", "B"] as const).flatMap(
    (channel): Omit<K230SignalBus, "connections">[] => [
      {
        name: `LP4_${channel}_BYTE0`,
        preferredLayers: ["top", "inner4"],
        maxLengthSkew: 8,
        baseBand: -1,
      },
      {
        name: `LP4_${channel}_BYTE1`,
        preferredLayers: ["inner5", "bottom"],
        maxLengthSkew: 8,
        baseBand: 1,
      },
      {
        name: `LP4_${channel}_CA_CTRL`,
        preferredLayers: ["inner6"],
        maxLengthSkew: 15,
        baseBand: 0,
      },
      {
        name: `LP4_${channel}_CLOCK`,
        preferredLayers: ["inner5"],
        maxLengthSkew: 0.25,
        baseBand: 0,
      },
      {
        name: `LP4_${channel}_DQS0`,
        preferredLayers: ["inner5"],
        maxLengthSkew: 0.25,
        baseBand: -1,
      },
      {
        name: `LP4_${channel}_DQS1`,
        preferredLayers: ["inner5"],
        maxLengthSkew: 0.25,
        baseBand: 1,
      },
      {
        name: `LP4_${channel}_DMI0`,
        preferredLayers: ["inner5"],
        baseBand: -1,
      },
      { name: `LP4_${channel}_DMI1`, preferredLayers: ["inner5"], baseBand: 1 },
    ],
  ),
  { name: "LP4_RESET", preferredLayers: ["inner6"], baseBand: 0 },
]
// Explicit fanout benchmark skew budgets; these are not DDR timing signoff.
export const K230_SIGNAL_BUSES: readonly K230SignalBus[] = rules.map((bus) => ({
  ...bus,
  connections: K230_SIGNAL_CONNECTIONS.filter(
    (connection) => connection.busName === bus.name,
  ).map((connection) => connection.traceName),
}))
export const K230_DIFFERENTIAL_PAIRS = (["A", "B"] as const).flatMap(
  (channel) => [
    {
      name: `LP4_${channel}_CLOCK_PAIR`,
      positiveConnection: `LP4_CLK${channel}P`,
      negativeConnection: `LP4_CLK${channel}N`,
      lengthTolerance: 0.25,
    },
    ...([0, 1] as const).map((byte) => ({
      name: `LP4_${channel}_DQS${byte}_PAIR`,
      positiveConnection: `LP4_DQS${channel}${byte}P`,
      negativeConnection: `LP4_DQS${channel}${byte}N`,
      lengthTolerance: 0.25,
    })),
  ],
)
const planeDrops = (
  ballNames: readonly string[],
  pinSignal: "VSS" | "VDDIO_DDR",
  netName: "GND" | "VDD_LPDDR4",
  layer: "inner1" | "inner2",
) =>
  ballNames.map((ballName) => ({
    ballName,
    pinNumber: getK230PinNumber(ballName),
    pinSignal,
    netName,
    layer,
    traceName: `U1_${pinSignal}_${ballName}_DROP`,
  }))
export const K230_PLANE_DROPS = [
  ...planeDrops(K230_VSS_BALL_NAMES, "VSS", "GND", "inner1"),
  ...planeDrops(K230_DDR_IO_BALL_NAMES, "VDDIO_DDR", "VDD_LPDDR4", "inner2"),
]
if (K230_SIGNAL_CONNECTIONS.length !== 65 || K230_PLANE_DROPS.length !== 106)
  throw new Error(
    "K230 must retain 65 single-rank LPDDR4 signals and 106 digital plane drops",
  )
