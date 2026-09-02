import { expect, test } from "bun:test"
import { FanoutSolver } from "@tscircuit/fanout-solver"
import { AM62L_SIGNAL_BUSES } from "lib/am62l-buses"
import {
  COMPLETE_BUS_COUNT,
  COMPLETE_CONNECTION_COUNT,
  PLANE_DROP_COUNT,
  SHARED_BOUNDARY,
  SIGNAL_CONNECTION_COUNT,
} from "lib/create-am62l-fanout-sample"
import { FANOUT_DIRECTION_CASES } from "lib/fanout-directions"
import { AM62L_SAMPLE_DEFINITIONS } from "../samples"

const EDGE_PREFIX = {
  top: "topside_",
  right: "rightside_",
  bottom: "bottomside_",
  left: "leftside_",
} as const

test("all 12 cases contain every AM62L signal and plane bus from core", () => {
  expect(FANOUT_DIRECTION_CASES).toHaveLength(12)
  expect(AM62L_SAMPLE_DEFINITIONS).toHaveLength(12)
  expect(AM62L_SAMPLE_DEFINITIONS.map((sample) => sample.exitPosition)).toEqual(
    FANOUT_DIRECTION_CASES.map((sample) => sample.exitPosition),
  )
  expect(AM62L_SIGNAL_BUSES.map((bus) => bus.name)).toEqual([
    "DDR_BYTE0",
    "DDR_BYTE1",
    "DDR_ADDR_CTRL",
    "DDR_CLOCK",
    "DDR_DQS0",
    "DDR_DQS1",
    "DDR_RESET",
    "DDR_DMI0",
    "DDR_DMI1",
  ])

  for (const sampleDefinition of AM62L_SAMPLE_DEFINITIONS) {
    const sample = sampleDefinition.createSample()
    const directionCase = sample.directionCase
    const buses = sample.solverOptions.buses ?? []
    const planeBuses = buses.filter((bus) => bus.termination?.type === "plane")
    const signalBuses = buses.filter((bus) => bus.termination?.type !== "plane")

    expect(sample.simpleRouteJson.layerCount).toBe(8)
    expect(sample.simpleRouteJson.obstacles).toHaveLength(373)
    expect(sample.simpleRouteJson.connections).toHaveLength(
      COMPLETE_CONNECTION_COUNT,
    )
    expect(buses).toHaveLength(COMPLETE_BUS_COUNT)
    expect(planeBuses).toHaveLength(PLANE_DROP_COUNT)
    expect(signalBuses).toHaveLength(9)
    expect(
      signalBuses.reduce((total, bus) => total + bus.connectionNames.length, 0),
    ).toBe(SIGNAL_CONNECTION_COUNT)
    expect(sample.simpleRouteJson.differentialPairs).toHaveLength(3)
    expect(sample.solverOptions.escapeLayers).toEqual([
      "top",
      "inner4",
      "inner5",
      "inner6",
      "bottom",
    ])
    expect(Object.keys(sample.solverOptions.busDirections ?? {})).toHaveLength(
      PLANE_DROP_COUNT,
    )

    expect(
      planeBuses.filter(
        (bus) =>
          bus.termination?.type === "plane" &&
          bus.termination.layer === "inner1",
      ),
    ).toHaveLength(97)
    expect(
      planeBuses.filter(
        (bus) =>
          bus.termination?.type === "plane" &&
          bus.termination.layer === "inner2",
      ),
    ).toHaveLength(5)
    for (const bus of planeBuses) {
      expect(bus.connectionNames).toHaveLength(1)
      const connection = sample.simpleRouteJson.connections.find(
        (candidate) => candidate.name === bus.connectionNames[0],
      )
      expect(connection?.pointsToConnect).toHaveLength(1)
    }

    for (const busDefinition of AM62L_SIGNAL_BUSES) {
      const bus = signalBuses.find(
        (candidate) => candidate.busId === busDefinition.name,
      )
      expect(bus?.connectionNames).toHaveLength(
        busDefinition.connections.length,
      )
      expect(bus?.allowedLayers).toEqual([...busDefinition.preferredLayers])
      expect(
        bus?.exitPosition?.startsWith(EDGE_PREFIX[directionCase.exitEdge]),
      ).toBe(true)
      expect(Object.keys(bus?.connectionExitTargets ?? {})).toHaveLength(
        busDefinition.connections.length,
      )

      for (const [connectionName, target] of Object.entries(
        bus?.connectionExitTargets ?? {},
      )) {
        expect(bus?.allowedLayers).toContain(target.layer)
        const connection = sample.simpleRouteJson.connections.find(
          (candidate) => candidate.name === connectionName,
        )
        expect(connection?.pointsToConnect).toHaveLength(2)
        switch (directionCase.exitEdge) {
          case "top":
            expect(target.y).toBeCloseTo(SHARED_BOUNDARY.maxY)
            break
          case "right":
            expect(target.x).toBeCloseTo(SHARED_BOUNDARY.maxX)
            break
          case "bottom":
            expect(target.y).toBeCloseTo(SHARED_BOUNDARY.minY)
            break
          case "left":
            expect(target.x).toBeCloseTo(SHARED_BOUNDARY.minX)
            break
        }
      }
    }

    // GenericSolverDebugger uses this exact constructor. Building it for every
    // case catches malformed bus membership before the browser starts stepping.
    expect(
      () => new FanoutSolver(sample.simpleRouteJson, sample.solverOptions),
    ).not.toThrow()
  }
}, 120_000)
