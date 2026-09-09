import { expect, test } from "bun:test"
import { selectSamples } from "../scripts/count-solved-samples"

test("solve-count selects all seven chip families without changing legacy sample selectors", () => {
  const all = selectSamples([])
  expect(all.samples).toHaveLength(74)
  expect(all.singleSample).toBe(false)
  expect(new Set(all.samples.map((sample) => sample.id)).size).toBe(74)

  for (const chip of [
    "am62l",
    "rk3308",
    "k230",
    "imx6ull",
    "t113s3",
    "am3352",
  ] as const) {
    const family = selectSamples(["--chip", chip])
    expect(family.samples).toHaveLength(12)
    expect(family.samples.every((sample) => sample.chip === chip)).toBe(true)
  }

  const am62lDdr4 = selectSamples(["--chip", "am62l-ddr4"])
  expect(am62lDdr4.samples).toHaveLength(2)
  expect(
    am62lDdr4.samples.every((sample) => sample.chip === "am62l-ddr4"),
  ).toBe(true)

  expect(
    selectSamples(["--chip", "t113s3", "--sample", "topside_left"]).samples.map(
      (s) => s.id,
    ),
  ).toEqual(["49-t113s3-top-left-offset"])
  expect(
    selectSamples(["--sample", "60-t113s3-left-top-offset"]).samples.map(
      (s) => s.id,
    ),
  ).toEqual(["60-t113s3-left-top-offset"])
  expect(
    selectSamples(["--chip", "am3352", "--sample", "topside_left"]).samples.map(
      (s) => s.id,
    ),
  ).toEqual(["61-am3352-top-left-offset"])
  expect(
    selectSamples(["--sample", "72-am3352-left-top-offset"]).samples.map(
      (s) => s.id,
    ),
  ).toEqual(["72-am3352-left-top-offset"])
  const legacy = selectSamples(["--sample", "topside_left"])
  expect(legacy.singleSample).toBe(true)
  expect(legacy.samples.map((sample) => sample.id)).toEqual([
    "01-top-left-offset",
  ])
  const rockchip = selectSamples([
    "--chip",
    "rk3308",
    "--sample",
    "topside_left",
  ])
  expect(rockchip.samples.map((sample) => sample.id)).toEqual([
    "13-rk3308-top-left-offset",
  ])
  expect(
    selectSamples(["--sample", "24-rk3308-left-top-offset"]).samples.map(
      (sample) => sample.id,
    ),
  ).toEqual(["24-rk3308-left-top-offset"])
  expect(
    selectSamples(["--sample", "12-left-top-offset"]).samples.map(
      (sample) => sample.id,
    ),
  ).toEqual(["12-left-top-offset"])

  expect(
    selectSamples(["--chip", "k230", "--sample", "topside_left"]).samples.map(
      (sample) => sample.id,
    ),
  ).toEqual(["25-k230-top-left-offset"])
  expect(
    selectSamples(["--sample", "36-k230-left-top-offset"]).samples.map(
      (sample) => sample.id,
    ),
  ).toEqual(["36-k230-left-top-offset"])
  expect(() =>
    selectSamples(["--chip", "rk3308", "--sample", "25-k230-top-left-offset"]),
  ).toThrow("does not belong to chip rk3308")

  expect(
    selectSamples([
      "--chip",
      "imx6ull",
      "--sample",
      "topside_left",
    ]).samples.map((sample) => sample.id),
  ).toEqual(["37-imx6ull-top-left-offset"])
  expect(
    selectSamples(["--sample", "48-imx6ull-left-top-offset"]).samples.map(
      (sample) => sample.id,
    ),
  ).toEqual(["48-imx6ull-left-top-offset"])

  expect(() =>
    selectSamples(["--chip", "all", "--sample", "topside_left"]),
  ).toThrow("matches multiple chips")
  expect(() =>
    selectSamples(["--chip", "am62l", "--sample", "13-rk3308-top-left-offset"]),
  ).toThrow("does not belong to chip am62l")
  expect(() => selectSamples(["--chip", "unknown"])).toThrow("Unknown chip")
  expect(() => selectSamples(["--sample", "unknown"])).toThrow(
    "Unknown fanout sample",
  )
  expect(() => selectSamples(["--sample", "--chip", "rk3308"])).toThrow(
    "requires a value",
  )
  expect(() => selectSamples(["--unknown"])).toThrow("Unknown argument")
  expect(() => selectSamples(["--chip", "am62l", "--chip", "rk3308"])).toThrow(
    "only be specified once",
  )
})
