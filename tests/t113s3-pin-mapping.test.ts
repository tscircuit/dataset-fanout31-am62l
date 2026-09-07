import { expect, test } from "bun:test"
import {
  T113S3_PINS,
  T113S3_PIN_NAMES,
  getT113s3Pin,
} from "../lib/t113s3-pin-map"
import { T113S3_PAD_POSITIONS } from "../lib/t113s3-footprint"
import {
  T113S3_POWER_PLANES,
  T113S3_PLANE_DROPS,
  T113S3_SIGNAL_CONNECTIONS,
  T113S3_SIGNAL_BUSES,
  T113S3_DIFFERENTIAL_PAIRS,
} from "../lib/t113s3-buses"

// Independent pin-number order, verified against TinyEmbedded-Dual-A U9,
// sheet 3 and Allwinner Table 4-2. Figure 7-1 contains conflicting labels.
const EXPECTED_PINS = `
PG6 PG7 PG8 PG9 PG10 PG11 PF0 PF1 PF2 PF3 PF4 PF5 PF6 PC7 PC6 PC5
PC4 PC3 PC2 VCC-PLL REFCLK-OUT DXOUT DXIN X32KOUT X32KIN VCC-RTC RESET LDOA-OUT LDO-IN LDOB-OUT PE13 PE12
PE3 VCC-PE PE2 PE11 PE10 PE9 PE8 PE7 PE6 PE5 PE4 PE0 PE1 VDD-SYS0
DZQ VCC-DRAM0 VCC-DRAM1 VDD18-DRAM VDD-SYS1 PD22 PD21 PD20 PD0 PD1 PD2 PD3 PD4 PD5 PD6 PD7
PD8 PD9 VCC-LVDS VCC-PD PD10 PD11 PD13 PD12 PD14 PD15 PD16 PD17 PD18 PD19 VCC-TVOUT TVOUT0
PB7 PB6 VDD-SYS2 PB5 VCC-IO PB4 PB3 PB2 MICIN3P MICIN3N AVCC VRA2 AGND VRA1 FMINR FMINL LINEINR LINEINL
HPVCC HPOUTR HPOUTL HPOUTFB GPADC0 TP-X1 TP-X2 TP-Y1 TP-Y2 NC0 VCC-TVIN TVIN0 TVIN1 TVIN-VRP TVIN-VRN USB1-DP
USB1-DM USB0-DM USB0-DP VDD-CORE0 VDD-CORE1 PG1 PG2 PG0 PG3 PG5 PG4 PG12 PG13 PG14 PG15 VCC-PG EPAD
`
  .trim()
  .split(/\s+/)

test("T113-S3 preserves all 128 lead functions and the exposed ground pad", () => {
  expect(T113S3_PIN_NAMES as readonly string[]).toEqual(EXPECTED_PINS)
  expect(T113S3_PINS).toHaveLength(129)
  expect(new Set(T113S3_PIN_NAMES).size).toBe(129)
  for (let i = 1; i <= 129; i++)
    expect(getT113s3Pin(i) as { pinNumber: number; name: string }).toEqual({
      pinNumber: i,
      name: EXPECTED_PINS[i - 1]!,
    })
  for (const invalid of [0, 130, 1.5])
    expect(() => getT113s3Pin(invalid)).toThrow()
  const connected = [...T113S3_SIGNAL_CONNECTIONS, ...T113S3_PLANE_DROPS].map(
    (p) => p.pinNumber,
  )
  expect(connected.toSorted((a, b) => a - b)).toEqual(
    Array.from({ length: 129 }, (_, i) => i + 1).filter((n) => n !== 106),
  )
  expect(T113S3_SIGNAL_CONNECTIONS).toHaveLength(106)
  expect(T113S3_SIGNAL_BUSES).toHaveLength(38)
  expect(T113S3_SIGNAL_BUSES.flatMap((b) => b.connections).toSorted()).toEqual(
    T113S3_SIGNAL_CONNECTIONS.map((c) => c.traceName).toSorted(),
  )
})

test("QFP land pattern uses counterclockwise top-view numbering and 5.72 mm EPAD", () => {
  expect(T113S3_PAD_POSITIONS).toHaveLength(129)
  const check = (
    pinNumber: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ) =>
    expect(T113S3_PAD_POSITIONS[pinNumber - 1]).toMatchObject({
      pinNumber,
      x,
      y,
      width,
      height,
    })
  for (let i = 0; i < 32; i++) {
    const t = Number((6.2 - i * 0.4).toFixed(3))
    check(i + 1, -7.7, t, 1.5, 0.2)
    check(i + 33, -t, -7.7, 0.2, 1.5)
    check(i + 65, 7.7, -t, 1.5, 0.2)
    check(i + 97, t, 7.7, 0.2, 1.5)
  }
  check(129, 0, 0, 5.72, 5.72)
  expect(T113S3_PAD_POSITIONS[105]?.name).toBe("NC0")
})

test("supply inputs use separate voltage planes; regulator outputs and references are not shorted", () => {
  expect(T113S3_POWER_PLANES).toEqual([
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
  ])
  expect(T113S3_PLANE_DROPS).toHaveLength(22)
  // LDO outputs, ZQ calibration, crystal pins, audio and TV references must
  // have their own external terminal instead of a direct VCC/GND connection.
  for (const pinNumber of [
    21, 22, 23, 24, 25, 28, 30, 47, 90, 92, 100, 110, 111,
  ]) {
    expect(T113S3_PLANE_DROPS.some((p) => p.pinNumber === pinNumber)).toBe(
      false,
    )
    expect(
      T113S3_SIGNAL_CONNECTIONS.filter((p) => p.pinNumber === pinNumber),
    ).toHaveLength(1)
  }
  expect(
    T113S3_DIFFERENTIAL_PAIRS.map((p) => [
      p.positiveConnection,
      p.negativeConnection,
    ]),
  ).toEqual([
    ["PIN115_USB0_DP", "PIN114_USB0_DM"],
    ["PIN112_USB1_DP", "PIN113_USB1_DM"],
    ["PIN87_MICIN3P", "PIN88_MICIN3N"],
  ])
})
