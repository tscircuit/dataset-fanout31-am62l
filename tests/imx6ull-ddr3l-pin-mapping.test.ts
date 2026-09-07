import { expect, test } from "bun:test"
import { IMX6ULL_BALL_MAP } from "../lib/imx6ull-ball-map"
import {
  IMX6ULL_SIGNAL_CONNECTIONS,
  IMX6ULL_PLANE_DROPS,
} from "../lib/imx6ull-buses"
import {
  IMX6ULL_PAD_POSITIONS,
  getImx6ullPinNumber,
} from "../lib/imx6ull-footprint"

// Independent NXP IMX6ULLIEC Table 91 functional contact assignments,
// pp. 114-117; Samsung K4B4G1646E Rev. 1.0 sections 3.1-3.2 for memory.
const EXPECTED = [
  ["DRAM_DATA00", "T4", "DQ0", "E3"],
  ["DRAM_DATA01", "U6", "DQ1", "F7"],
  ["DRAM_DATA02", "T6", "DQ2", "F2"],
  ["DRAM_DATA03", "U7", "DQ3", "F8"],
  ["DRAM_DATA04", "U8", "DQ4", "H3"],
  ["DRAM_DATA05", "T8", "DQ5", "H8"],
  ["DRAM_DATA06", "T5", "DQ6", "G2"],
  ["DRAM_DATA07", "U4", "DQ7", "H7"],
  ["DRAM_DATA08", "U2", "DQ8", "D7"],
  ["DRAM_DATA09", "U3", "DQ9", "C3"],
  ["DRAM_DATA10", "U5", "DQ10", "C8"],
  ["DRAM_DATA11", "R4", "DQ11", "C2"],
  ["DRAM_DATA12", "P5", "DQ12", "A7"],
  ["DRAM_DATA13", "P3", "DQ13", "A2"],
  ["DRAM_DATA14", "R2", "DQ14", "B8"],
  ["DRAM_DATA15", "R1", "DQ15", "A3"],
  ["DRAM_ADDR00", "L5", "A0", "N3"],
  ["DRAM_ADDR01", "H2", "A1", "P7"],
  ["DRAM_ADDR02", "K1", "A2", "P3"],
  ["DRAM_ADDR03", "M2", "A3", "N2"],
  ["DRAM_ADDR04", "K4", "A4", "P8"],
  ["DRAM_ADDR05", "L1", "A5", "P2"],
  ["DRAM_ADDR06", "G2", "A6", "R8"],
  ["DRAM_ADDR07", "H4", "A7", "R2"],
  ["DRAM_ADDR08", "J4", "A8", "T8"],
  ["DRAM_ADDR09", "L2", "A9", "R3"],
  ["DRAM_ADDR10", "M4", "A10", "L7"],
  ["DRAM_ADDR11", "K3", "A11", "R7"],
  ["DRAM_ADDR12", "L4", "A12", "N7"],
  ["DRAM_ADDR13", "H3", "A13", "T3"],
  ["DRAM_ADDR14", "G1", "A14", "T7"],
  ["DRAM_SDBA0", "M1", "BA0", "M2"],
  ["DRAM_SDBA1", "H1", "BA1", "N8"],
  ["DRAM_SDBA2", "K2", "BA2", "M3"],
  ["DRAM_CS0_B", "N2", "CS_N", "L2"],
  ["DRAM_SDCKE0", "M3", "CKE", "K9"],
  ["DRAM_ODT0", "N1", "ODT", "K1"],
  ["DRAM_RAS_B", "M5", "RAS_N", "J3"],
  ["DRAM_CAS_B", "J2", "CAS_N", "K3"],
  ["DRAM_SDWE_B", "J1", "WE_N", "L3"],
  ["DRAM_SDCLK0_P", "P1", "CK", "J7"],
  ["DRAM_SDCLK0_N", "P2", "CK_N", "K7"],
  ["DRAM_SDQS0_P", "P6", "DQS0", "F3"],
  ["DRAM_SDQS0_N", "P7", "DQS0_N", "G3"],
  ["DRAM_SDQS1_P", "T1", "DQS1", "C7"],
  ["DRAM_SDQS1_N", "T2", "DQS1_N", "B7"],
  ["DRAM_RESET", "G4", "RESET_N", "T2"],
  ["DRAM_DQM0", "T7", "DM0", "E7"],
  ["DRAM_DQM1", "T3", "DM1", "D3"],
] as const

test("i.MX 6ULL maps all 49 DDR3L signals without bit or polarity swaps", () => {
  expect(
    IMX6ULL_SIGNAL_CONNECTIONS.map((c) => [
      c.socSignal,
      c.socBall,
      c.memorySignal,
      c.memoryBall,
    ]),
  ).toEqual(EXPECTED.map((c) => [...c]))
  expect(new Set(IMX6ULL_SIGNAL_CONNECTIONS.map((c) => c.socBall)).size).toBe(
    49,
  )
  for (const [signal, ball] of EXPECTED)
    expect(IMX6ULL_BALL_MAP[ball]).toBe(signal)
  // Extra rank/address signals and analog references must stay unconnected.
  for (const ball of ["F1", "H5", "J3", "K5", "N4", "P4", "N6", "M12"]) {
    expect(getImx6ullPinNumber(ball)).toBeGreaterThan(0)
    expect(IMX6ULL_SIGNAL_CONNECTIONS.some((c) => c.socBall === ball)).toBe(
      false,
    )
    expect(IMX6ULL_PLANE_DROPS.some((c) => c.ballName === ball)).toBe(false)
  }
})

test("MAPBGA289 preserves every occupied site with top-view orientation", () => {
  const rows = "A B C D E F G H J K L M N P R T U".split(" ")
  const expected = rows.flatMap((row, y) =>
    Array.from({ length: 17 }, (_, x) => ({
      ballName: `${row}${x + 1}`,
      pinNumber: y * 17 + x + 1,
      x: Number((-6.4 + x * 0.8).toFixed(3)),
      y: Number((6.4 - y * 0.8).toFixed(3)),
    })),
  )
  expect(IMX6ULL_PAD_POSITIONS.map(({ signalName, ...pad }) => pad)).toEqual(
    expected,
  )
  expect(Object.keys(IMX6ULL_BALL_MAP)).toHaveLength(289)
  for (const ball of ["I1", "O1", "A18", "V1", "A0"])
    expect(() => getImx6ullPinNumber(ball)).toThrow()
})

test("only Table 90 VSS and NVCC_DRAM balls drop to their planes", () => {
  const ground =
    "A1 A17 C3 C7 C11 C15 E8 E11 F6 F7 F8 F9 F10 F11 F12 G3 G5 G7 G12 G15 H7 H12 J5 J7 J12 K7 K12 L3 L7 L12 M7 M8 M9 M10 M11 N3 N5 R3 R5 R7 R11 R16 R17 T14 U1 U14 U17".split(
      " ",
    )
  const supply = "G6 H6 J6 K6 L6 M6".split(" ")
  expect(IMX6ULL_PLANE_DROPS).toHaveLength(53)
  for (const [balls, signal, net, layer] of [
    [ground, "VSS", "GND", "inner1"],
    [supply, "NVCC_DRAM", "VDD_DDR3L", "inner2"],
  ] as const) {
    expect(
      IMX6ULL_PLANE_DROPS.filter((d) => d.netName === net)
        .map((d) => d.ballName)
        .sort(),
    ).toEqual([...balls].sort())
    for (const ball of balls) {
      expect(IMX6ULL_BALL_MAP[ball]).toBe(signal)
      expect(
        IMX6ULL_PLANE_DROPS.find((d) => d.ballName === ball),
      ).toMatchObject({
        pinSignal: signal,
        netName: net,
        layer,
        pinNumber: getImx6ullPinNumber(ball),
      })
    }
  }
})
