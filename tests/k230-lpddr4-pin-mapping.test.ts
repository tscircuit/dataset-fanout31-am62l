import { expect, test } from "bun:test"
import {
  K230_BALL_MAP,
  K230_DDR_IO_BALL_NAMES,
  K230_LPDDR4_SIGNAL_BALL_MAP,
  K230_VSS_BALL_NAMES,
} from "../lib/k230-ball-map"
import {
  K230_DIFFERENTIAL_PAIRS,
  K230_PLANE_DROPS,
  K230_SIGNAL_BUSES,
  K230_SIGNAL_CONNECTIONS,
} from "../lib/k230-buses"
import { getK230PinNumber, K230_PAD_POSITIONS } from "../lib/k230-footprint"
import {
  getK230Lpddr4PinNumber,
  K230_LPDDR4_PAD_POSITIONS,
  K230_LPDDR4_SIGNAL_BALLS,
} from "../lib/k230-lpddr4-footprint"

// Independent manufacturer anchors, not values derived from the runtime maps:
// Canaan K230_PINOUT_V1.2_20240822.xlsx, K230 Pin Number / Function Description
// columns and worksheet 3.K230管脚分布图-13x13mm. The V1.1 revision corrected
// DDR descriptions, superseding the older 2023 schematic's DQB byte labels.
// https://kendryte-download.canaan-creative.com/developer/k230/HDK/K230%E7%A1%AC%E4%BB%B6%E6%96%87%E6%A1%A3/K230_PINOUT_V1.2_20240822.xlsx
// Micron 200b_z00m_sdp_ddp_auto_lpddr4_lpddr4x.pdf, Rev. F 10/2020:
// Figure 2 (single x16 channel/rank), Figure 4 (balls), Figure 7 (FW geometry).
// https://datasheet.lcsc.com/datasheet/pdf/cafc8b028f5fedc321cc6d079eead257.pdf?productCode=C5330485
const SOC_ROWS = "A B C D E F G H J K L M N P R T U V W Y".split(" ")
const SOC_EMPTY = new Set("A1 E5 F5 R4 R5 T4 T5 T6 U4 U5".split(" "))
const MEMORY_GRID_ROWS = "A B C D E F G H J K L M N P R T U V W Y AA AB".split(
  " ",
)
const MEMORY_COLUMNS = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12]
const DQ_MEMORY_BALLS =
  "B2 C2 E2 F2 F4 E4 C4 B4 B11 C11 E11 F11 F9 E9 C9 B9".split(" ")
const DQ_SOC_BALLS = {
  A: "U16 T16 V16 Y16 W18 V18 Y18 U17 R17 T18 R18 U20 W19 U18 P16 T17".split(
    " ",
  ),
  B: "C14 D14 B14 A14 A17 B16 C16 B17 C19 B19 E17 E18 C18 D17 D16 C17".split(
    " ",
  ),
}
// [CPU LPDDR4 alias, CPU ball, RAM function, RAM ball].
const CONTROL_ENDPOINTS = [
  ["CAA0", "M19", "CA0", "H2"],
  ["CAA1", "L16", "CA1", "J2"],
  ["CAA2", "N19", "CA2", "H9"],
  ["CAA3", "N20", "CA3", "H10"],
  ["CAA4", "M18", "CA4", "H11"],
  ["CAA5", "P19", "CA5", "J11"],
  ["CSA0", "T20", "CS0", "H4"],
  ["CKEA0", "N17", "CKE0", "J4"],
  ["CLKAP", "R19", "CK", "J8"],
  ["CLKAN", "R20", "CK_N", "J9"],
  ["DQSA0P", "W17", "DQS0", "D3"],
  ["DQSA0N", "Y17", "DQS0_N", "E3"],
  ["DQSA1P", "V20", "DQS1", "D10"],
  ["DQSA1N", "V19", "DQS1_N", "E10"],
  ["DMIA0", "V17", "DMI0", "C3"],
  ["DMIA1", "P17", "DMI1", "C10"],
  ["CAB0", "E20", "CA0", "H2"],
  ["CAB1", "G19", "CA1", "J2"],
  ["CAB2", "G18", "CA2", "H9"],
  ["CAB3", "H17", "CA3", "H10"],
  ["CAB4", "F17", "CA4", "H11"],
  ["CAB5", "F19", "CA5", "J11"],
  ["CSB0", "J20", "CS0", "H4"],
  ["CKEB0", "J18", "CKE0", "J4"],
  ["CLKBP", "G20", "CK", "J8"],
  ["CLKBN", "F20", "CK_N", "J9"],
  ["DQSB0P", "B15", "DQS0", "D3"],
  ["DQSB0N", "A15", "DQS0_N", "E3"],
  ["DQSB1P", "B18", "DQS1", "D10"],
  ["DQSB1N", "A18", "DQS1_N", "E10"],
  ["DMIB0", "C15", "DMI0", "C3"],
  ["DMIB1", "D18", "DMI1", "C10"],
] as const
const EXPECTED_VSS = (
  "A13 A16 A19 B13 B20 C13 D9 D10 D11 D13 D15 E4 E6 E7 E8 E12 E13 E14 E15 E16 E19 " +
  "F4 F6 F10 F16 G6 G13 G14 G15 G16 H7 H11 H13 H15 H16 H20 J7 J11 J13 J15 " +
  "K3 K6 K8 K10 K12 K14 K16 K18 L7 L8 L10 L12 L15 L19 M6 M8 M10 M12 M15 M16 " +
  "N3 N5 N8 N10 N12 N15 N16 P6 P7 P8 P10 P12 P14 P15 P20 R3 R6 R7 R10 R12 R14 R16 " +
  "T3 T7 T8 T9 T15 U3 U8 U19 V3 V4 V5 V6 V7 V8 W1 W16 W20 Y13 Y19"
).split(" ")
const EXPECTED_DDR_IO = ["H14", "J14", "L14", "M14", "N14"]

test("K230 and each LPDDR4 preserve all occupied balls and manufacturer top-view geometry", () => {
  const expectedSoc = SOC_ROWS.flatMap((row, y) =>
    Array.from({ length: 20 }, (_, x) => ({
      ballName: `${row}${x + 1}`,
      x: Number((-6.175 + x * 0.65).toFixed(3)),
      y: Number((6.175 - y * 0.65).toFixed(3)),
    })).filter(({ ballName }) => !SOC_EMPTY.has(ballName)),
  ).map((pad, i) => ({ ...pad, pinNumber: i + 1 }))
  expect(expectedSoc).toHaveLength(390)
  expect(K230_PAD_POSITIONS.map(({ signalName, ...pad }) => pad)).toEqual(
    expectedSoc,
  )
  expect(Object.keys(K230_BALL_MAP).toSorted()).toEqual(
    expectedSoc.map((p) => p.ballName).toSorted(),
  )
  for (const pad of expectedSoc)
    expect(getK230PinNumber(pad.ballName)).toBe(pad.pinNumber)
  for (const ball of SOC_EMPTY) expect(() => getK230PinNumber(ball)).toThrow()

  const expectedMemory = MEMORY_GRID_ROWS.flatMap((row, y) =>
    row === "L" || row === "M"
      ? []
      : MEMORY_COLUMNS.map((column) => ({
          ballName: `${row}${column}`,
          x: Number((-5.2 + column * 0.8).toFixed(3)),
          y: Number((6.825 - y * 0.65).toFixed(3)),
        })),
  ).map((pad, i) => ({ ...pad, pinNumber: i + 1 }))
  expect(expectedMemory).toHaveLength(200)
  expect(
    K230_LPDDR4_PAD_POSITIONS.map(({ signalName, ...pad }) => pad),
  ).toEqual(expectedMemory)
  for (const pad of expectedMemory)
    expect(getK230Lpddr4PinNumber(pad.ballName)).toBe(pad.pinNumber)
  for (const row of MEMORY_GRID_ROWS) {
    for (const column of [6, 7])
      expect(() => getK230Lpddr4PinNumber(`${row}${column}`)).toThrow()
  }
  for (const row of ["L", "M"]) {
    for (const column of MEMORY_COLUMNS)
      expect(() => getK230Lpddr4PinNumber(`${row}${column}`)).toThrow()
  }
  // NC and DNU are physically occupied; local ZQ/ODT are not CPU signals.
  for (const [ball, signal] of [
    ["A1", "DNU"],
    ["A8", "NC"],
    ["A5", "ZQ"],
    ["G2", "ODT_CA"],
  ]) {
    expect(
      K230_LPDDR4_PAD_POSITIONS.find((p) => p.ballName === ball)?.signalName,
    ).toBe(signal)
    expect(Object.values(K230_LPDDR4_SIGNAL_BALLS)).not.toContain(ball)
  }
  for (const ball of ["A20", "Y1", "Y20"])
    expect(K230_BALL_MAP[ball]).toBe("NC")
})

test("all 65 K230 signals preserve corrected LPDDR4 channels, bits, polarity, and shared reset", () => {
  const expected = (["A", "B"] as const).flatMap((channel) => [
    ...DQ_SOC_BALLS[channel].map((ball, bit) => ({
      socSignal: `DQ${channel}${bit}`,
      socBall: ball,
      memorySignal: `DQ${bit}`,
      memoryBall: DQ_MEMORY_BALLS[bit]!,
      componentName: channel === "A" ? "U2" : "U3",
      channel,
    })),
    ...CONTROL_ENDPOINTS.slice(
      channel === "A" ? 0 : 16,
      channel === "A" ? 16 : 32,
    ).map(([signal, ball, memorySignal, memoryBall]) => ({
      socSignal: signal,
      socBall: ball,
      memorySignal,
      memoryBall,
      componentName: channel === "A" ? "U2" : "U3",
      channel,
    })),
    {
      socSignal: "RESET_N",
      socBall: "J16",
      memorySignal: "RESET_N",
      memoryBall: "T11",
      componentName: channel === "A" ? "U2" : "U3",
      channel,
    },
  ])
  // Two groups of 32 channel signals plus the same reset output at both RAMs.
  expect(expected).toHaveLength(66)
  expect(K230_SIGNAL_CONNECTIONS).toHaveLength(65)
  const actual: typeof expected = K230_SIGNAL_CONNECTIONS.flatMap((c) =>
    c.memoryEndpoints.map((m) => ({
      socSignal: c.socSignal,
      socBall: c.socBall,
      memorySignal: m.signal,
      memoryBall: m.ball,
      componentName: m.componentName,
      channel: m.channel,
    })),
  )
  const key = (value: (typeof actual)[number]) =>
    `${value.componentName}:${value.socSignal}`
  expect(actual.toSorted((a, b) => key(a).localeCompare(key(b)))).toEqual(
    expected.toSorted((a, b) => key(a).localeCompare(key(b))),
  )
  for (const field of [
    "socSignal",
    "socBall",
    "socPinNumber",
    "traceName",
  ] as const)
    expect(new Set(K230_SIGNAL_CONNECTIONS.map((c) => c[field])).size).toBe(65)
  for (const c of K230_SIGNAL_CONNECTIONS) {
    expect(K230_LPDDR4_SIGNAL_BALL_MAP[c.socBall]).toBe(c.socSignal)
    if (c.socSignal !== "RESET_N")
      expect(K230_BALL_MAP[c.socBall]).toEndWith(`_${c.socSignal}`)
    expect(c.socPinNumber).toBe(getK230PinNumber(c.socBall))
    expect(c.traceName).toBe(`LP4_${c.socSignal}`)
    for (const m of c.memoryEndpoints) {
      expect(m.ball).toBe(K230_LPDDR4_SIGNAL_BALLS[m.signal])
      expect(m.pinNumber).toBe(getK230Lpddr4PinNumber(m.ball))
    }
  }
  for (const component of ["U2", "U3"])
    expect(
      new Set(
        actual
          .filter((c) => c.componentName === component)
          .map((c) => c.memoryBall),
      ).size,
    ).toBe(33)
  const reset = K230_SIGNAL_CONNECTIONS.filter((c) => c.socSignal === "RESET_N")
  expect(reset).toHaveLength(1)
  expect(reset[0]?.socBall).toBe("J16")
  expect(
    reset[0]?.memoryEndpoints.map((m) => [m.componentName, m.ball]),
  ).toEqual([
    ["U2", "T11"],
    ["U3", "T11"],
  ])
  expect(K230_BALL_MAP.J16).toBe("DDR_RESET")

  expect(K230_BALL_MAP.C17).toBe("DDR_DQ0_DQB15")
  expect(K230_BALL_MAP.B18).toBe("DDR_DQS0P_DQSB1P")
  expect(actual.find((c) => c.socBall === "C17")?.memorySignal).toBe("DQ15")
  expect(actual.find((c) => c.socBall === "B18")?.memorySignal).toBe("DQS1")
  // LPDDR3's primary pad names must not replace the corrected LPDDR4 aliases.
  expect(actual.find((c) => c.socBall === "C17")?.memorySignal).not.toBe("DQ0")
  expect(actual.find((c) => c.socBall === "B18")?.memorySignal).not.toBe("DQS0")
  expect(Object.keys(K230_LPDDR4_SIGNAL_BALL_MAP)).toHaveLength(69)
  for (const [ball, signal] of [
    ["P18", "CKEA1"],
    ["J17", "CKEB1"],
    ["T19", "CSA1"],
    ["J19", "CSB1"],
  ]) {
    expect(K230_LPDDR4_SIGNAL_BALL_MAP[ball!]).toBe(signal)
    expect(K230_SIGNAL_CONNECTIONS.some((c) => c.socBall === ball)).toBe(false)
  }
  expect(K230_SIGNAL_BUSES).toHaveLength(17)
  expect(K230_SIGNAL_BUSES.flatMap((b) => b.connections).toSorted()).toEqual(
    K230_SIGNAL_CONNECTIONS.map((c) => c.traceName).toSorted(),
  )
  expect(
    K230_DIFFERENTIAL_PAIRS.map((p) => [
      p.positiveConnection,
      p.negativeConnection,
    ]),
  ).toEqual([
    ["LP4_CLKAP", "LP4_CLKAN"],
    ["LP4_DQSA0P", "LP4_DQSA0N"],
    ["LP4_DQSA1P", "LP4_DQSA1N"],
    ["LP4_CLKBP", "LP4_CLKBN"],
    ["LP4_DQSB0P", "LP4_DQSB0N"],
    ["LP4_DQSB1P", "LP4_DQSB1N"],
  ])
  const memoryFunctions = Object.fromEntries(
    K230_LPDDR4_PAD_POSITIONS.map((p) => [p.ballName, p.signalName]),
  )
  for (const pair of K230_DIFFERENTIAL_PAIRS) {
    const positive = K230_SIGNAL_CONNECTIONS.find(
      (c) => c.traceName === pair.positiveConnection,
    )!
    const negative = K230_SIGNAL_CONNECTIONS.find(
      (c) => c.traceName === pair.negativeConnection,
    )!
    expect(positive.busName).toBe(negative.busName)
    expect(positive.memoryEndpoints[0]?.channel).toBe(
      negative.memoryEndpoints[0]?.channel,
    )
    expect(memoryFunctions[positive.memoryEndpoints[0]!.ball]).toEndWith("_t")
    expect(memoryFunctions[negative.memoryEndpoints[0]!.ball]).toEndWith("_c")
  }
})

test("106 distinct digital plane drops retain their exact supply classification", () => {
  expect(EXPECTED_VSS).toHaveLength(101)
  expect(K230_VSS_BALL_NAMES.toSorted()).toEqual(EXPECTED_VSS.toSorted())
  expect(K230_DDR_IO_BALL_NAMES.toSorted()).toEqual(EXPECTED_DDR_IO.toSorted())
  expect(K230_PLANE_DROPS).toHaveLength(106)
  expect(new Set(K230_PLANE_DROPS.map((d) => d.ballName)).size).toBe(106)
  expect(K230_PLANE_DROPS.filter((d) => d.netName === "GND")).toHaveLength(101)
  expect(
    K230_PLANE_DROPS.filter((d) => d.netName === "VDD_LPDDR4"),
  ).toHaveLength(5)
  for (const drop of K230_PLANE_DROPS) {
    const isGround = EXPECTED_VSS.includes(drop.ballName)
    expect(isGround || EXPECTED_DDR_IO.includes(drop.ballName)).toBe(true)
    expect(drop.pinSignal).toBe(isGround ? "VSS" : "VDDIO_DDR")
    expect(K230_BALL_MAP[drop.ballName]).toBe(drop.pinSignal)
    expect(drop.netName).toBe(isGround ? "GND" : "VDD_LPDDR4")
    expect(drop.layer).toBe(isGround ? "inner1" : "inner2")
    expect(drop.pinNumber).toBe(getK230PinNumber(drop.ballName))
    expect(
      K230_SIGNAL_CONNECTIONS.some((c) => c.socBall === drop.ballName),
    ).toBe(false)
  }
  // Analog grounds, local calibration/reference and unrelated supplies stay distinct.
  for (const ball of ["F11", "G7", "G8"]) {
    expect(K230_BALL_MAP[ball]).toBe("AVSS")
    expect(K230_PLANE_DROPS.some((d) => d.ballName === ball)).toBe(false)
  }
  for (const ball of ["K19", "K20", "L20", "M20"]) {
    expect(getK230PinNumber(ball)).toBeGreaterThan(0)
    expect(K230_SIGNAL_CONNECTIONS.some((c) => c.socBall === ball)).toBe(false)
    expect(K230_PLANE_DROPS.some((d) => d.ballName === ball)).toBe(false)
  }
})
