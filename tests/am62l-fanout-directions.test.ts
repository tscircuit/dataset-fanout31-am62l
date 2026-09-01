import { expect, test } from "bun:test"
import { FanoutSolver } from "@tscircuit/fanout-solver"
import {
  createAm62lFanoutSample,
  SHARED_BOUNDARY,
} from "lib/create-am62l-fanout-sample"
import { FANOUT_DIRECTION_CASES } from "lib/fanout-directions"

test("all 12 AM62L fanout directions solve on their requested boundary bands", () => {
  expect(FANOUT_DIRECTION_CASES).toHaveLength(12)

  for (const directionCase of FANOUT_DIRECTION_CASES) {
    const sample = createAm62lFanoutSample(directionCase.exitPosition)
    const solver = new FanoutSolver(
      sample.simpleRouteJson,
      sample.solverOptions,
    )
    solver.solve()

    if (solver.failed) {
      throw new Error(
        `${directionCase.exitPosition}: ${solver.error ?? "solver failed"}`,
      )
    }
    const output = solver.getOutput()
    expect(output.validation.valid).toBe(true)
    expect(output.fanoutTraces).toHaveLength(4)

    for (const trace of output.fanoutTraces) {
      const exit = trace.route.at(-1)
      expect(exit?.route_type).toBe("wire")
      if (!exit || exit.route_type !== "wire") continue

      switch (directionCase.exitEdge) {
        case "top":
          expect(exit.y).toBeCloseTo(SHARED_BOUNDARY.maxY)
          break
        case "right":
          expect(exit.x).toBeCloseTo(SHARED_BOUNDARY.maxX)
          break
        case "bottom":
          expect(exit.y).toBeCloseTo(SHARED_BOUNDARY.minY)
          break
        case "left":
          expect(exit.x).toBeCloseTo(SHARED_BOUNDARY.minX)
          break
      }

      const bandCoordinate =
        directionCase.exitEdge === "top" || directionCase.exitEdge === "bottom"
          ? exit.x
          : exit.y
      if (directionCase.bandCoordinate < 0)
        expect(bandCoordinate).toBeLessThan(0)
      if (directionCase.bandCoordinate > 0)
        expect(bandCoordinate).toBeGreaterThan(0)
      if (directionCase.bandCoordinate === 0) {
        expect(Math.abs(bandCoordinate)).toBeLessThan(2)
      }
    }
  }
}, 120_000)
