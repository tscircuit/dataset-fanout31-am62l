import type { FanoutEdge } from "@tscircuit/fanout-solver"
import { AM3352_PINS, AM3352_NC_BALLS } from "./am3352-pin-map"

// SPRS717L §§5.4–5.5: ZCZ revision B, Turbo MPU (800 MHz), OPP100 core,
// DDR3 1.5 V and all six VDDSHV banks at 3.3 V. These are operating-point
// routing fixtures, not a power-sequencing implementation (start at OPP100).
// RTC internal LDO enabled by grounding RTC_KALDO_ENn; CAP_VDD_RTC and
// the three other CAP_* outputs go to independent decoupling endpoints.
// No remote MPU sensing: VDD_MPU_MON joins MPU per Table 4-2 note 31.
const planeDefinitions = [
  {
    netName: "GND",
    layer: "inner1",
    voltage: 0,
    names: [
      "VSS",
      "VSSA_ADC",
      "VSSA_USB",
      "VSS_OSC",
      "VSS_RTC",
      "RTC_KALDO_ENn",
    ],
  },
  {
    netName: "VCC_IO_3V3",
    layer: "inner2",
    voltage: 3.3,
    names: [
      "VDDSHV1",
      "VDDSHV2",
      "VDDSHV3",
      "VDDSHV4",
      "VDDSHV5",
      "VDDSHV6",
      "VDDA3P3V_USB0",
      "VDDA3P3V_USB1",
    ],
  },
  {
    netName: "VCC_1V8",
    layer: "inner3",
    voltage: 1.8,
    names: [
      "VDDS",
      "VDDS_RTC",
      "VDDS_SRAM_CORE_BG",
      "VDDS_SRAM_MPU_BB",
      "VDDS_PLL_DDR",
      "VDDS_PLL_CORE_LCD",
      "VDDS_PLL_MPU",
      "VDDS_OSC",
      "VDDA1P8V_USB0",
      "VDDA1P8V_USB1",
      "VDDA_ADC",
    ],
  },
  {
    netName: "VCC_DDR_1V5",
    layer: "inner4",
    voltage: 1.5,
    names: ["VDDS_DDR"],
  },
  {
    netName: "VDD_CORE_1V1",
    layer: "inner5",
    voltage: 1.1,
    names: ["VDD_CORE"],
  },
  {
    netName: "VDD_MPU_1V26",
    layer: "inner6",
    voltage: 1.26,
    names: ["VDD_MPU", "VDD_MPU_MON"],
  },
] as const
export const AM3352_POWER_PLANES = planeDefinitions.map((plane) => ({
  ...plane,
  pins: AM3352_PINS.filter((p) =>
    (plane.names as readonly string[]).includes(p.name),
  ).map((p) => p.pinNumber),
}))
export const AM3352_PLANE_DROPS = AM3352_POWER_PLANES.flatMap((plane) =>
  plane.pins.map((pinNumber) => ({
    pinNumber,
    netName: plane.netName,
    layer: plane.layer,
    traceName: `U1_PIN${pinNumber}_DROP`,
  })),
)
const planePins = new Set(AM3352_PLANE_DROPS.map((p) => p.pinNumber))
export const AM3352_SIGNAL_PINS = AM3352_PINS.filter(
  (p) =>
    !(AM3352_NC_BALLS as readonly string[]).includes(p.ballName) &&
    !planePins.has(p.pinNumber),
)
export const AM3352_ROUTING_LAYERS = [
  "top",
  "inner7",
  "inner8",
  "bottom",
] as const
const traceName = (pinNumber: number) =>
  `PIN${pinNumber}_${AM3352_PINS[pinNumber - 1]!.name}`
interface SignalBusGroup {
  name: string
  pins: number[]
  baseBand: number
  exitEdge: FanoutEdge
  maxLengthSkew?: number
}
const byNames = (names: string[]) =>
  names.map((name) => {
    const pin = AM3352_SIGNAL_PINS.find((p) => p.name === name)
    if (!pin) throw new Error(`Missing AM3352 signal ${name}`)
    return pin.pinNumber
  })
const sequence = (prefix: string, count: number, start = 0) =>
  Array.from({ length: count }, (_, i) => `${prefix}${i + start}`)
const bus = (
  name: string,
  exitEdge: FanoutEdge,
  baseBand: number,
  names: string[],
  maxLengthSkew?: number,
): SignalBusGroup => ({
  name,
  exitEdge,
  baseBand,
  pins: byNames(names),
  maxLengthSkew,
})
// Group physical pin names (mode-0 groups), not simultaneously enabled mux
// alternatives. LCD_DATA also carries SYSBOOT straps; values remain external.
const groups = [
  bus(
    "DDR_CA",
    "left",
    1,
    [
      ...sequence("DDR_A", 16),
      ...sequence("DDR_BA", 3),
      "DDR_CASn",
      "DDR_RASn",
      "DDR_WEn",
      "DDR_CKE",
      "DDR_CSn0",
      "DDR_ODT",
      "DDR_RESETn",
    ],
    0.5,
  ),
  bus("DDR_CLK", "left", 0, ["DDR_CK", "DDR_CKn"], 0.1),
  bus(
    "DDR_BYTE0",
    "left",
    -1,
    [...sequence("DDR_D", 8), "DDR_DQM0", "DDR_DQS0", "DDR_DQSn0"],
    0.25,
  ),
  bus(
    "DDR_BYTE1",
    "left",
    0,
    [...sequence("DDR_D", 8, 8), "DDR_DQM1", "DDR_DQS1", "DDR_DQSn1"],
    0.25,
  ),
  bus("LCD", "bottom", 1, [
    ...sequence("LCD_DATA", 16),
    "LCD_AC_BIAS_EN",
    "LCD_HSYNC",
    "LCD_VSYNC",
    "LCD_PCLK",
  ]),
  bus("GPMC_AD", "bottom", 0, sequence("GPMC_AD", 16)),
  bus("GPMC_A", "bottom", -1, sequence("GPMC_A", 12)),
  bus("GPMC_CONTROL", "bottom", -1, [
    ...sequence("GPMC_CSn", 4),
    "GPMC_CLK",
    "GPMC_ADVn_ALE",
    "GPMC_OEn_REn",
    "GPMC_BEn0_CLE",
    "GPMC_BEn1",
    "GPMC_WEn",
    "GPMC_WPn",
    "GPMC_WAIT0",
  ]),
  bus("ETHERNET", "right", 0, [
    ...sequence("MII1_TXD", 4),
    ...sequence("MII1_RXD", 4),
    "MII1_TX_CLK",
    "MII1_RX_CLK",
    "MII1_TX_EN",
    "MII1_RX_DV",
    "MII1_RX_ER",
    "MII1_CRS",
    "MII1_COL",
    "RMII1_REF_CLK",
    "MDIO",
    "MDC",
  ]),
  bus("MMC0", "right", -1, [
    ...sequence("MMC0_DAT", 4),
    "MMC0_CMD",
    "MMC0_CLK",
  ]),
  bus("USB0", "right", 1, ["USB0_DP", "USB0_DM"], 0.1),
  bus("USB1", "right", 1, ["USB1_DP", "USB1_DM"], 0.1),
  bus("SPI0", "top", 1, [
    "SPI0_SCLK",
    "SPI0_D0",
    "SPI0_D1",
    "SPI0_CS0",
    "SPI0_CS1",
  ]),
  bus("I2C0", "top", 1, ["I2C0_SDA", "I2C0_SCL"]),
  bus("UART0", "top", 1, [
    "UART0_TXD",
    "UART0_RXD",
    "UART0_CTSn",
    "UART0_RTSn",
  ]),
  bus("UART1", "top", 1, [
    "UART1_TXD",
    "UART1_RXD",
    "UART1_CTSn",
    "UART1_RTSn",
  ]),
  bus("MCASP0", "top", 0, [
    "MCASP0_ACLKX",
    "MCASP0_AHCLKX",
    "MCASP0_FSX",
    "MCASP0_AXR0",
    "MCASP0_ACLKR",
    "MCASP0_AHCLKR",
    "MCASP0_FSR",
    "MCASP0_AXR1",
  ]),
  bus("JTAG", "top", 0, ["TCK", "TMS", "TDI", "TDO", "TRSTn", "EMU0", "EMU1"]),
  bus("ADC", "top", -1, sequence("AIN", 8)),
]
const grouped = new Set(groups.flatMap((g) => g.pins))
// Auxiliary/reference/oscillator/decoupling endpoints stay independent.
const aux = AM3352_SIGNAL_PINS.filter((p) => !grouped.has(p.pinNumber)).map(
  (p, index) => ({
    name: `AUX_${p.name}`,
    pins: [p.pinNumber],
    baseBand: p.name.startsWith("DDR_") ? 0 : (index % 3) - 1,
    exitEdge: (Math.abs(p.x) > Math.abs(p.y)
      ? p.x > 0
        ? "right"
        : "left"
      : p.y > 0
        ? "top"
        : "bottom") as FanoutEdge,
  }),
)
export const AM3352_SIGNAL_BUSES = [...groups, ...aux].map(
  (b: SignalBusGroup) => ({
    ...b,
    connections: b.pins.map(traceName),
    preferredLayers: AM3352_ROUTING_LAYERS,
  }),
)
export const AM3352_SIGNAL_CONNECTIONS = AM3352_SIGNAL_BUSES.flatMap((bus) =>
  bus.pins.map((pinNumber) => ({
    pinNumber,
    traceName: traceName(pinNumber),
    busName: bus.name,
    targetEdge: bus.exitEdge,
  })),
)
export const AM3352_DIFFERENTIAL_PAIRS = [
  ["DDR_CK", "DDR_CKn"],
  ["DDR_DQS0", "DDR_DQSn0"],
  ["DDR_DQS1", "DDR_DQSn1"],
  ["USB0_DP", "USB0_DM"],
  ["USB1_DP", "USB1_DM"],
].map(([positive, negative]) => ({
  name: `${positive}_PAIR`,
  positiveConnection: traceName(byNames([positive!])[0]!),
  negativeConnection: traceName(byNames([negative!])[0]!),
  lengthTolerance: 0.1,
}))
const connected = [...AM3352_SIGNAL_CONNECTIONS, ...AM3352_PLANE_DROPS].map(
  (p) => p.pinNumber,
)
if (connected.length !== 322 || new Set(connected).size !== 322)
  throw new Error("AM3352 must connect all 322 operational balls exactly once")
