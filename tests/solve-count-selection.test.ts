import { expect, test } from "bun:test"
import { selectSamples } from "../scripts/count-solved-samples"

test("solve-count selects all three chip families without changing legacy sample selectors", () => {
  const all = selectSamples([])
  expect(all.samples).toHaveLength(36)
  expect(all.singleSample).toBe(false)
  expect(new Set(all.samples.map((sample) => sample.id)).size).toBe(36)

  for (const chip of ["am62l", "rk3308", "k230"] as const) {
    const family = selectSamples(["--chip", chip])
    expect(family.samples).toHaveLength(12)
    expect(family.samples.every((sample) => sample.chip === chip)).toBe(true)
  }

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
