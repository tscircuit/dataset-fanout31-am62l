import { expect, test } from "bun:test"
import {
  AM3352_BALL_MAP,
  AM3352_PINS,
  AM3352_NC_BALLS,
} from "../lib/am3352-pin-map"
import {
  AM3352_POWER_PLANES,
  AM3352_SIGNAL_CONNECTIONS,
  AM3352_SIGNAL_BUSES,
  AM3352_DIFFERENTIAL_PAIRS,
} from "../lib/am3352-buses"

test("ZCZ geometry and DDR pinout match TI SPRS717L, not the incompatible ZCE map", () => {
  expect(AM3352_PINS).toHaveLength(324)
  expect(new Set(AM3352_PINS.map((p) => p.ballName)).size).toBe(324)
  expect(AM3352_PINS[0]).toMatchObject({ ballName: "A1", x: -6.8, y: 6.8 })
  expect(AM3352_PINS[17]).toMatchObject({ ballName: "A18", x: 6.8, y: 6.8 })
  expect(AM3352_PINS[323]).toMatchObject({ ballName: "V18", x: 6.8, y: -6.8 })
  const ballsFor = (name: string) =>
    AM3352_PINS.filter((p) => p.name === name).map((p) => p.ballName)
  // Independently transcribed from Table 4-2's ZCZ column.
  const address = [
    "F3",
    "H1",
    "E4",
    "C3",
    "C2",
    "B1",
    "D5",
    "E2",
    "D4",
    "C1",
    "F4",
    "F2",
    "E3",
    "H3",
    "H4",
    "D3",
  ]
  const data = [
    "M3",
    "M4",
    "N1",
    "N2",
    "N3",
    "N4",
    "P3",
    "P4",
    "J1",
    "K1",
    "K2",
    "K3",
    "K4",
    "L3",
    "L4",
    "M1",
  ]
  address.forEach((ball, i) => expect(ballsFor(`DDR_A${i}`)).toEqual([ball]))
  data.forEach((ball, i) => expect(ballsFor(`DDR_D${i}`)).toEqual([ball]))
  for (const [ball, name] of Object.entries({
    D2: "DDR_CK",
    D1: "DDR_CKn",
    P1: "DDR_DQS0",
    P2: "DDR_DQSn0",
    L1: "DDR_DQS1",
    L2: "DDR_DQSn1",
    M2: "DDR_DQM0",
    J2: "DDR_DQM1",
    J3: "DDR_VTP",
    J4: "DDR_VREF",
    N17: "USB0_DP",
    N18: "USB0_DM",
    R17: "USB1_DP",
    R18: "USB1_DM",
    A3: "RESERVED",
    M5: "VPP",
  }))
    expect(AM3352_BALL_MAP[ball]).toBe(name)
})

test("all operational pins have one role; distinct voltages, capacitor outputs, references and NCs remain separate", () => {
  expect(AM3352_NC_BALLS).toEqual(["A3", "M5"])
  const planeBalls = (net: string) =>
    AM3352_POWER_PLANES.find((p) => p.netName === net)!.pins.map(
      (n) => AM3352_PINS[n - 1]!.ballName,
    )
  expect(planeBalls("VDD_CORE_1V1")).toEqual([
    "F6",
    "F7",
    "G6",
    "G7",
    "G10",
    "H11",
    "J12",
    "K6",
    "K8",
    "K12",
    "L6",
    "L7",
    "L8",
    "L9",
    "M11",
    "M13",
    "N8",
    "N9",
    "N12",
    "N13",
  ])
  expect(planeBalls("VDD_MPU_1V26")).toEqual([
    "A2",
    "F10",
    "F11",
    "F12",
    "F13",
    "G13",
    "H13",
    "J13",
  ])
  expect(planeBalls("VCC_DDR_1V5")).toEqual([
    "E5",
    "F5",
    "G5",
    "H5",
    "J5",
    "K5",
    "L5",
  ])
  expect(planeBalls("VCC_IO_3V3")).toEqual(
    [
      "E10",
      "E11",
      "E12",
      "E13",
      "F14",
      "G14",
      "H14",
      "J14",
      "K14",
      "L14",
      "N5",
      "N15",
      "P6",
      "P7",
      "P8",
      "P10",
      "P11",
      "P12",
      "P13",
      "R15",
      "P5",
    ].sort(
      (a, b) =>
        AM3352_PINS.findIndex((p) => p.ballName === a) -
        AM3352_PINS.findIndex((p) => p.ballName === b),
    ),
  )
  expect(planeBalls("VCC_1V8")).toEqual([
    "D7",
    "D8",
    "D10",
    "E6",
    "E7",
    "E9",
    "E14",
    "F9",
    "H15",
    "K13",
    "N6",
    "N16",
    "P9",
    "P14",
    "R10",
    "R11",
    "R16",
  ])
  expect(
    AM3352_POWER_PLANES.map((p) => [p.layer, p.voltage, p.pins.length]),
  ).toEqual([
    ["inner1", 0, 44],
    ["inner2", 3.3, 21],
    ["inner3", 1.8, 17],
    ["inner4", 1.5, 7],
    ["inner5", 1.1, 20],
    ["inner6", 1.26, 8],
  ])
  expect(new Set(planeBalls("GND"))).toEqual(
    new Set(
      "A1 A5 A18 B4 E8 F8 G8 G9 G11 G12 H6 H7 H8 H9 H10 H12 J6 J7 J8 J9 J10 J11 K7 K9 K10 K11 L10 L11 L12 L13 M6 M7 M8 M9 M10 M12 M14 N7 N10 N11 N14 V1 V11 V18".split(
        " ",
      ),
    ),
  ) // RTC_KALDO_ENn enables internal LDO.
  const signals = AM3352_SIGNAL_CONNECTIONS.map(
    (c) => AM3352_PINS[c.pinNumber - 1]!.ballName,
  )
  for (const ball of [
    "C10",
    "D9",
    "D11",
    "D6",
    "J3",
    "J4",
    "A9",
    "B9",
    "P15",
    "T18",
    "P16",
    "P17",
  ])
    expect(signals).toContain(ball)
  const connected = [
    ...AM3352_POWER_PLANES.flatMap((p) => p.pins),
    ...AM3352_SIGNAL_CONNECTIONS.map((p) => p.pinNumber),
  ]
  expect(connected).toHaveLength(322)
  expect(new Set(connected)).toEqual(
    new Set(
      AM3352_PINS.filter((p) => p.ballName !== "A3" && p.ballName !== "M5").map(
        (p) => p.pinNumber,
      ),
    ),
  )
  expect(AM3352_SIGNAL_CONNECTIONS).toHaveLength(205)
  expect(AM3352_SIGNAL_BUSES).toHaveLength(48)
  expect(AM3352_DIFFERENTIAL_PAIRS).toHaveLength(5)
})
