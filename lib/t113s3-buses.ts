import { T113S3_PINS, T113S3_NC_PIN } from "./t113s3-pin-map"

/** External-supply fixture; Table 5-2 recommended operating conditions.
 * GPIO D/E/G banks are configured for 3.3 V. Core and system share 0.95 V.
 * Each voltage has its own copper layer; no overlapping unlike-net pours.
 * LDOA/B outputs and TVIN/VRA references deliberately are NOT supply inputs:
 * route them individually for external decoupling/configuration, never short
 * the default 1.35 V LDOB output onto the externally supplied 1.5 V DRAM rail.
 */
export const T113S3_POWER_PLANES = [
  { netName: "GND", layer: "inner1", voltage: 0, pins: [91, 129] },
  {
    netName: "VCC_3V3",
    layer: "inner2",
    voltage: 3.3,
    pins: [29, 34, 66, 77, 83, 128],
  },
  {
    netName: "VCC_1V8",
    layer: "inner3",
    voltage: 1.8,
    pins: [20, 26, 50, 65, 89, 97, 107],
  },
  { netName: "VCC_DRAM_1V5", layer: "inner4", voltage: 1.5, pins: [48, 49] },
  {
    netName: "VDD_CORE_SYS_0V95",
    layer: "inner5",
    voltage: 0.95,
    pins: [46, 51, 81, 116, 117],
  },
] as const
export const T113S3_PLANE_DROPS = T113S3_POWER_PLANES.flatMap((plane) =>
  plane.pins.map((pinNumber) => ({
    pinNumber,
    netName: plane.netName,
    layer: plane.layer,
    traceName: `U1_PIN${pinNumber}_DROP`,
  })),
)
const planePins = new Set<number>(T113S3_PLANE_DROPS.map((p) => p.pinNumber))
export const T113S3_SIGNAL_PINS = T113S3_PINS.filter(
  (p) => p.pinNumber !== T113S3_NC_PIN && !planePins.has(p.pinNumber),
)
export const T113S3_ROUTING_LAYERS = ["top", "inner6", "bottom"] as const
const traceName = (pinNumber: number) =>
  `PIN${pinNumber}_${T113S3_PINS[pinNumber - 1]!.name.replaceAll("-", "_")}`

// GPIO banks represent physical port groups, without assuming a peripheral
// mux configuration. Fixed USB and microphone pairs retain their polarities.
interface SignalBusGroup {
  name: string
  pins: number[]
  baseBand: number
  maxLengthSkew?: number
}
const groupedBuses: SignalBusGroup[] = [
  { name: "GPIOB", pins: [86, 85, 84, 82, 80, 79], baseBand: -1 },
  { name: "GPIOC", pins: [19, 18, 17, 16, 15, 14], baseBand: 0 },
  {
    name: "GPIOD_0_9",
    pins: [55, 56, 57, 58, 59, 60, 61, 62, 63, 64],
    baseBand: -1,
  },
  {
    name: "GPIOD_10_22",
    pins: [67, 68, 70, 69, 71, 72, 73, 74, 75, 76, 54, 53, 52],
    baseBand: 1,
  },
  {
    name: "GPIOE",
    pins: [44, 45, 35, 33, 43, 42, 41, 40, 39, 38, 37, 36, 32, 31],
    baseBand: 0,
  },
  { name: "GPIOF", pins: [7, 8, 9, 10, 11, 12, 13], baseBand: 1 },
  {
    name: "GPIOG",
    pins: [120, 118, 119, 121, 123, 122, 1, 2, 3, 4, 5, 6, 124, 125, 126, 127],
    baseBand: 0,
  },
  { name: "USB0", pins: [115, 114], baseBand: -1, maxLengthSkew: 0.25 },
  { name: "USB1", pins: [112, 113], baseBand: 1, maxLengthSkew: 0.25 },
  { name: "MICIN3", pins: [87, 88], baseBand: 0, maxLengthSkew: 0.25 },
]
const groupedPins = new Set(groupedBuses.flatMap((b) => b.pins))
const signalBusGroups: SignalBusGroup[] = [
  ...groupedBuses,
  ...T113S3_SIGNAL_PINS.filter((p) => !groupedPins.has(p.pinNumber)).map(
    (p, i) => ({
      name: `AUX_${p.name.replaceAll("-", "_")}`,
      pins: [p.pinNumber],
      baseBand: (i % 3) - 1,
    }),
  ),
]
export const T113S3_SIGNAL_BUSES = signalBusGroups.map((b) => ({
  ...b,
  connections: b.pins.map(traceName),
  preferredLayers: T113S3_ROUTING_LAYERS,
  maxLengthSkew: b.maxLengthSkew,
}))
export const T113S3_SIGNAL_CONNECTIONS = T113S3_SIGNAL_BUSES.flatMap((bus) =>
  bus.pins.map((pinNumber) => ({
    pinNumber,
    traceName: traceName(pinNumber),
    busName: bus.name,
  })),
)
export const T113S3_DIFFERENTIAL_PAIRS = [
  { name: "USB0_PAIR", positivePin: 115, negativePin: 114 },
  { name: "USB1_PAIR", positivePin: 112, negativePin: 113 },
  { name: "MICIN3_PAIR", positivePin: 87, negativePin: 88 },
].map((pair) => ({
  name: pair.name,
  positiveConnection: traceName(pair.positivePin),
  negativeConnection: traceName(pair.negativePin),
  lengthTolerance: 0.25,
}))

if (
  T113S3_SIGNAL_CONNECTIONS.length !== 106 ||
  T113S3_PLANE_DROPS.length !== 22 ||
  new Set(
    [...T113S3_SIGNAL_CONNECTIONS, ...T113S3_PLANE_DROPS].map(
      (p) => p.pinNumber,
    ),
  ).size !== 128
)
  throw new Error(
    "T113-S3 must connect all 127 non-NC leads plus its exposed ground pad exactly once",
  )
