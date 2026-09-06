import { expect, test } from "bun:test"
import {
  DDR3L_BALL_NAMES,
  DDR3L_PAD_POSITIONS,
  DDR3L_PART_NUMBER,
  DDR3L_SIGNAL_BALLS,
  getDdr3lPinNumber,
} from "../lib/ddr3l-footprint"
import {
  RK3308_BALL_MAP,
  RK3308_DDR_SIGNAL_BALL_MAP,
  RK3308_DDR_VDD_BALL_NAMES,
  RK3308_VSS_BALL_NAMES,
} from "../lib/rk3308-ball-map"
import {
  RK3308_DIFFERENTIAL_PAIRS,
  RK3308_PLANE_DROPS,
  RK3308_SIGNAL_BUSES,
  RK3308_SIGNAL_CONNECTIONS,
} from "../lib/rk3308-buses"
import {
  getRk3308PinNumber,
  RK3308_PAD_POSITIONS,
} from "../lib/rk3308-footprint"

// Independent transcription: Rockchip RK3308 Rev 1.0, Fig. 2-3 (p. 17)
// and Table 2-1 (pp. 22-26); Samsung K4B4G1646E Rev 1.0, sections 3.1-3.2.
// Expected values deliberately do not come from the production ball maps.
const SOC_ROWS = "A B C D E F G H J K L M N P R T U V W Y".split(" ")
const SOC_EMPTY_BALLS = new Set(
  (
    "A7 A8 A11 A14 A16 C1 C10 D1 D4 D9 F20 G4 G7 G19 G20 " +
    "H1 H5 H19 H20 J1 J2 J20 K6 K20 L6 M1 M3 P1 P2 R1 R2 R13 " +
    "U1 W8 W10 W13 W15 W17 Y4 Y6 Y8 Y10 Y13 Y15 Y17"
  ).split(" "),
)
const MEMORY_ROWS = "A B C D E F G H J K L M N P R T".split(" ")
const MEMORY_COLUMNS = [1, 2, 3, 7, 8, 9]

// [SoC signal, SoC ball, memory signal, memory ball]. These direct logical
// connections preserve every data/address bit and each differential polarity.
const EXPECTED_SIGNAL_CONNECTIONS = [
  ["DDR_DQ0", "J4", "DQ0", "E3"],
  ["DDR_DQ1", "G5", "DQ1", "F7"],
  ["DDR_DQ2", "H4", "DQ2", "F2"],
  ["DDR_DQ3", "L1", "DQ3", "F8"],
  ["DDR_DQ4", "E2", "DQ4", "H3"],
  ["DDR_DQ5", "F1", "DQ5", "H8"],
  ["DDR_DQ6", "E3", "DQ6", "G2"],
  ["DDR_DQ7", "K2", "DQ7", "H7"],
  ["DDR_DQ8", "F4", "DQ8", "D7"],
  ["DDR_DQ9", "G2", "DQ9", "C3"],
  ["DDR_DQ10", "L4", "DQ10", "C8"],
  ["DDR_DQ11", "D3", "DQ11", "C2"],
  ["DDR_DQ12", "L2", "DQ12", "A7"],
  ["DDR_DQ13", "F3", "DQ13", "A2"],
  ["DDR_DQ14", "M2", "DQ14", "B8"],
  ["DDR_DQ15", "K5", "DQ15", "A3"],
  ["DDR_A0", "B4", "A0", "N3"],
  ["DDR_A1", "A5", "A1", "P7"],
  ["DDR_A2", "A3", "A2", "P3"],
  ["DDR_A3", "E6", "A3", "N2"],
  ["DDR_A4", "B7", "A4", "P8"],
  ["DDR_A5", "B3", "A5", "P2"],
  ["DDR_A6", "A6", "A6", "R8"],
  ["DDR_A7", "A2", "A7", "R2"],
  ["DDR_A8", "A10", "A8", "T8"],
  ["DDR_A9", "E7", "A9", "R3"],
  ["DDR_A10", "C9", "A10", "L7"],
  ["DDR_A11", "B5", "A11", "R7"],
  ["DDR_A12", "B6", "A12", "N7"],
  ["DDR_A13", "D7", "A13", "T3"],
  ["DDR_A14", "B10", "A14", "T7"],
  ["DDR_BA0", "B2", "BA0", "M2"],
  ["DDR_BA1", "C8", "BA1", "N8"],
  ["DDR_BA2", "D6", "BA2", "M3"],
  ["DDR_CS0N", "B1", "CS_N", "L2"],
  ["DDR_CKE", "B9", "CKE", "K9"],
  ["DDR_ODT0", "C5", "ODT", "K1"],
  ["DDR_RASN", "D5", "RAS_N", "J3"],
  ["DDR_CASN", "D8", "CAS_N", "K3"],
  ["DDR_WEN", "E8", "WE_N", "L3"],
  ["DDR_CLK", "C3", "CK", "J7"],
  ["DDR_CLKN", "C2", "CK_N", "K7"],
  ["DDR_DQS0", "J3", "DQS0", "F3"],
  ["DDR_DQS0N", "K4", "DQS0_N", "G3"],
  ["DDR_DQS1", "H2", "DQS1", "C7"],
  ["DDR_DQS1N", "H3", "DQS1_N", "B7"],
  ["DDR_RESET", "E4", "RESET_N", "T2"],
  ["DDR_DM0", "G1", "DM0", "E7"],
  ["DDR_DM1", "L3", "DM1", "D3"],
] as const

test("RK3308 and DDR3L preserve package vacancies and all 49 datasheet signal connections", () => {
  expect(SOC_EMPTY_BALLS.size).toBe(45)
  const expectedSocPads = SOC_ROWS.flatMap((row, rowIndex) =>
    Array.from({ length: 20 }, (_, columnIndex) => ({
      ballName: `${row}${columnIndex + 1}`,
      x: Number((-6.175 + columnIndex * 0.65).toFixed(3)),
      y: Number((6.175 - rowIndex * 0.65).toFixed(3)),
    })).filter(({ ballName }) => !SOC_EMPTY_BALLS.has(ballName)),
  ).map((pad, index) => ({ ...pad, pinNumber: index + 1 }))
  expect(RK3308_PAD_POSITIONS).toHaveLength(355)
  expect(
    RK3308_PAD_POSITIONS.map(({ signalName, ...position }) => position),
  ).toEqual(expectedSocPads)
  expect(Object.keys(RK3308_BALL_MAP).sort()).toEqual(
    expectedSocPads.map(({ ballName }) => ballName).sort(),
  )
  for (const pad of expectedSocPads)
    expect(getRk3308PinNumber(pad.ballName)).toBe(pad.pinNumber)
  for (const ballName of SOC_EMPTY_BALLS)
    expect(() => getRk3308PinNumber(ballName)).toThrow()

  const expectedMemoryPads = MEMORY_ROWS.flatMap((row, rowIndex) =>
    MEMORY_COLUMNS.map((column) => ({
      ballName: `${row}${column}`,
      x: Number((-4 + column * 0.8).toFixed(4)),
      y: Number((6 - rowIndex * 0.8).toFixed(4)),
    })),
  ).map((pad, index) => ({ ...pad, pinNumber: index + 1 }))
  expect(DDR3L_PART_NUMBER).toBe("K4B4G1646E-BYMA")
  expect(DDR3L_PAD_POSITIONS).toHaveLength(96)
  expect(DDR3L_PAD_POSITIONS).toEqual(expectedMemoryPads)
  expect(DDR3L_BALL_NAMES).toEqual(
    expectedMemoryPads.map(({ ballName }) => ballName),
  )
  for (const pad of expectedMemoryPads)
    expect(getDdr3lPinNumber(pad.ballName)).toBe(pad.pinNumber)
  for (const row of MEMORY_ROWS) {
    for (const column of [4, 5, 6])
      expect(() => getDdr3lPinNumber(`${row}${column}`)).toThrow()
  }
  for (const invalidBall of ["A0", "A21", "I1", "Z1"]) {
    expect(() => getRk3308PinNumber(invalidBall)).toThrow()
    expect(() => getDdr3lPinNumber(invalidBall)).toThrow()
  }

  expect(RK3308_SIGNAL_CONNECTIONS).toHaveLength(49)
  expect(Object.keys(RK3308_DDR_SIGNAL_BALL_MAP)).toHaveLength(49)
  expect(Object.keys(DDR3L_SIGNAL_BALLS)).toHaveLength(49)
  const actualSignals = RK3308_SIGNAL_CONNECTIONS.map((connection) => [
    connection.socSignal,
    connection.socBall,
    connection.memorySignal,
    connection.memoryBall,
  ])
  expect(actualSignals.toSorted()).toEqual(
    EXPECTED_SIGNAL_CONNECTIONS.map((connection) => [...connection]).toSorted(),
  )
  for (const [
    socSignal,
    socBall,
    memorySignal,
    memoryBall,
  ] of EXPECTED_SIGNAL_CONNECTIONS) {
    expect(RK3308_BALL_MAP[socBall]).toBe(socSignal)
    expect(RK3308_DDR_SIGNAL_BALL_MAP[socBall]).toBe(socSignal)
    expect(DDR3L_SIGNAL_BALLS[memorySignal]).toBe(memoryBall)
  }
  for (const field of [
    "socBall",
    "socPinNumber",
    "memoryBall",
    "memoryPinNumber",
    "traceName",
  ] as const)
    expect(
      new Set(RK3308_SIGNAL_CONNECTIONS.map((connection) => connection[field]))
        .size,
    ).toBe(49)
  for (const connection of RK3308_SIGNAL_CONNECTIONS) {
    expect(connection.socPinNumber).toBe(getRk3308PinNumber(connection.socBall))
    expect(connection.memoryPinNumber).toBe(
      getDdr3lPinNumber(connection.memoryBall),
    )
    expect(connection.traceName).toBe(connection.memorySignal)
  }
  expect(
    RK3308_SIGNAL_BUSES.flatMap((bus) => bus.connections).toSorted(),
  ).toEqual(
    EXPECTED_SIGNAL_CONNECTIONS.map(
      ([, , memorySignal]) => memorySignal,
    ).toSorted(),
  )
  expect(
    RK3308_DIFFERENTIAL_PAIRS.map((pair) => [
      pair.positiveConnection,
      pair.negativeConnection,
    ]),
  ).toEqual([
    ["CK", "CK_N"],
    ["DQS0", "DQS0_N"],
    ["DQS1", "DQS1_N"],
  ])

  // The 4 Gb part has A14 at T7; M7 and the four other NC balls remain physical
  // obstacles, but must never become fictitious address/control connections.
  for (const ballName of ["J1", "J9", "L1", "L9", "M7"]) {
    expect(getDdr3lPinNumber(ballName)).toBeGreaterThan(0)
    expect(
      RK3308_SIGNAL_CONNECTIONS.some(
        (connection) => connection.memoryBall === ballName,
      ),
    ).toBe(false)
  }

  expect(RK3308_VSS_BALL_NAMES).toHaveLength(106)
  expect(RK3308_DDR_VDD_BALL_NAMES.toSorted()).toEqual(
    ["E10", "F7", "F8", "F9", "G6", "H6", "J6"].sort(),
  )
  expect(RK3308_PLANE_DROPS).toHaveLength(113)
  expect(new Set(RK3308_PLANE_DROPS.map((drop) => drop.ballName)).size).toBe(
    113,
  )
  expect(
    RK3308_PLANE_DROPS.filter((drop) => drop.netName === "GND"),
  ).toHaveLength(106)
  expect(
    RK3308_PLANE_DROPS.filter((drop) => drop.netName === "VDD_DDR3L"),
  ).toHaveLength(7)
  for (const drop of RK3308_PLANE_DROPS) {
    expect(RK3308_BALL_MAP[drop.ballName]).toBe(drop.pinSignal)
    expect(drop.pinNumber).toBe(getRk3308PinNumber(drop.ballName))
    expect(drop.netName).toBe(drop.pinSignal === "VSS" ? "GND" : "VDD_DDR3L")
    expect(drop.layer).toBe(drop.pinSignal === "VSS" ? "inner1" : "inner2")
    expect(RK3308_DDR_SIGNAL_BALL_MAP[drop.ballName]).toBeUndefined()
  }
  for (const [ballName, signalName] of Object.entries(RK3308_BALL_MAP)) {
    const isDigitalPlane = signalName === "VSS" || signalName === "DDR_VDD"
    expect(RK3308_PLANE_DROPS.some((drop) => drop.ballName === ballName)).toBe(
      isDigitalPlane,
    )
  }
  // These ground-like names are intentionally separate from digital VSS.
  expect(RK3308_BALL_MAP.D19).toBe("TVSS")
  expect(RK3308_BALL_MAP.G15).toBe("PLL_VSS")
  expect(RK3308_BALL_MAP.L17).toBe("CODEC_AVSS")
})
