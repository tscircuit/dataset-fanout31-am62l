import { expect, test } from "bun:test"
import { FanoutSolver } from "@tscircuit/fanout-solver"
import type { Imx6ullFanoutSample } from "../lib/create-imx6ull-fanout-sample"
import { DDR3L_PAD_POSITIONS } from "../lib/ddr3l-footprint"
import {
  IMX6ULL_DIFFERENTIAL_PAIRS,
  IMX6ULL_PLANE_DROPS,
  IMX6ULL_SIGNAL_BUSES,
  IMX6ULL_SIGNAL_CONNECTIONS,
} from "../lib/imx6ull-buses"
import { IMX6ULL_FANOUT_DIRECTION_CASES } from "../lib/imx6ull-fanout-directions"
import { IMX6ULL_PAD_POSITIONS } from "../lib/imx6ull-footprint"
import { IMX6ULL_SAMPLE_DEFINITIONS } from "../samples"

type CapturedRouteJson = Imx6ullFanoutSample["simpleRouteJson"] & {
  allowViaInPad?: boolean
}
type CapturedObstacle = CapturedRouteJson["obstacles"][number] & {
  circuitJsonMetadata?: { source_port_name?: string; pcb_port_id?: string }
}
type CapturedConnection = CapturedRouteJson["connections"][number] & {
  source_trace_id?: string
}

// Independent physical placements: the SoC is fixed at the origin, while RAM
// moves 18 mm toward the selected edge and +/-6 mm along its requested band.
const MEMORY_PLACEMENTS = {
  topside_left: { x: -6, y: 18, rotation: 90 },
  topside_center: { x: 0, y: 18, rotation: 90 },
  topside_right: { x: 6, y: 18, rotation: 90 },
  rightside_top: { x: 18, y: 6, rotation: 0 },
  rightside_center: { x: 18, y: 0, rotation: 0 },
  rightside_bottom: { x: 18, y: -6, rotation: 0 },
  bottomside_right: { x: 6, y: -18, rotation: 90 },
  bottomside_center: { x: 0, y: -18, rotation: 90 },
  bottomside_left: { x: -6, y: -18, rotation: 90 },
  leftside_bottom: { x: -18, y: -6, rotation: 0 },
  leftside_center: { x: -18, y: 0, rotation: 0 },
  leftside_top: { x: -18, y: 6, rotation: 0 },
} as const

const EDGE_PREFIX = {
  top: "topside_",
  right: "rightside_",
  bottom: "bottomside_",
  left: "leftside_",
} as const

const expectPoint = (
  actual: { x: number; y: number },
  expected: { x: number; y: number },
) => {
  expect(actual.x).toBeCloseTo(expected.x, 8)
  expect(actual.y).toBeCloseTo(expected.y, 8)
}

test("all 12 IMX6ULL cases retain every DDR signal and physically move real RAM around a fixed SoC", async () => {
  expect(IMX6ULL_FANOUT_DIRECTION_CASES).toHaveLength(12)
  expect(IMX6ULL_SAMPLE_DEFINITIONS).toHaveLength(12)
  expect(
    IMX6ULL_SAMPLE_DEFINITIONS.map((sample) => sample.exitPosition),
  ).toEqual(IMX6ULL_FANOUT_DIRECTION_CASES.map((sample) => sample.exitPosition))
  expect(IMX6ULL_SIGNAL_BUSES.map((bus) => bus.name)).toEqual([
    "DDR_BYTE0",
    "DDR_BYTE1",
    "DDR_ADDR_CTRL",
    "DDR_CLOCK",
    "DDR_DQS0",
    "DDR_DQS1",
    "DDR_RESET",
    "DDR_DM0",
    "DDR_DM1",
  ])
  const observedMemoryCenters = new Set<string>()
  let originalBoundary: Imx6ullFanoutSample["solverOptions"]["sharedBoundary"]

  for (const sampleDefinition of IMX6ULL_SAMPLE_DEFINITIONS) {
    const sample = await sampleDefinition.createSample()
    const { simpleRouteJson, solverOptions, directionCase } = sample
    const sharedBoundary = solverOptions.sharedBoundary
    if (!sharedBoundary) throw new Error("Missing core-generated SoC boundary")
    const buses = solverOptions.buses ?? []
    const planeBuses = buses.filter((bus) => bus.termination?.type === "plane")
    const signalBuses = buses.filter((bus) => bus.termination?.type !== "plane")
    const connectionByName = new Map(
      (simpleRouteJson.connections as CapturedConnection[]).map(
        (connection) => [connection.name, connection],
      ),
    )

    expect(sample.id).toBe(
      IMX6ULL_FANOUT_DIRECTION_CASES.find(
        (candidate) => candidate.exitPosition === sampleDefinition.exitPosition,
      )!.id,
    )
    expect(simpleRouteJson.connections).toHaveLength(102)
    expect(simpleRouteJson.obstacles).toHaveLength(385)
    expect(buses).toHaveLength(62)
    expect(planeBuses).toHaveLength(53)
    expect(signalBuses).toHaveLength(9)
    expect(simpleRouteJson.differentialPairs).toHaveLength(3)
    expect(signalBuses.flatMap((bus) => bus.connectionNames)).toHaveLength(49)
    expect(new Set(buses.flatMap((bus) => bus.connectionNames)).size).toBe(102)
    expect(new Set(buses.flatMap((bus) => bus.connectionNames))).toEqual(
      new Set(connectionByName.keys()),
    )
    expect(simpleRouteJson.layerCount).toBe(8)
    expect(solverOptions.escapeLayers).toEqual([
      "top",
      "inner4",
      "inner5",
      "inner6",
      "bottom",
    ])
    expect(simpleRouteJson).toMatchObject({ allowBlindAndBuriedVias: false })
    expect((simpleRouteJson as CapturedRouteJson).allowViaInPad).not.toBe(true)
    expect(Object.keys(solverOptions.busDirections ?? {})).toHaveLength(53)
    expect(
      planeBuses.filter(
        (bus) =>
          bus.termination?.type === "plane" &&
          bus.termination.layer === "inner1",
      ),
    ).toHaveLength(47)
    expect(
      planeBuses.filter(
        (bus) =>
          bus.termination?.type === "plane" &&
          bus.termination.layer === "inner2",
      ),
    ).toHaveLength(6)
    originalBoundary ??= sharedBoundary
    expect(sharedBoundary).toEqual(originalBoundary)

    const obstaclesByComponent = Map.groupBy(
      simpleRouteJson.obstacles as CapturedObstacle[],
      (obstacle) => obstacle.componentId,
    )
    expect(obstaclesByComponent.size).toBe(2)
    const socObstacles = [...obstaclesByComponent.values()].find(
      (pads) => pads.length === 289,
    )!
    const memoryObstacles = [...obstaclesByComponent.values()].find(
      (pads) => pads.length === 96,
    )!
    expect(socObstacles).toHaveLength(289)
    expect(memoryObstacles).toHaveLength(96)
    const socPadByPin = new Map(
      socObstacles.map((pad) => [
        pad.circuitJsonMetadata?.source_port_name,
        pad,
      ]),
    )
    const memoryPadByPin = new Map(
      memoryObstacles.map((pad) => [
        pad.circuitJsonMetadata?.source_port_name,
        pad,
      ]),
    )
    const placement = MEMORY_PLACEMENTS[directionCase.exitPosition]

    // Check every captured pad, including unconnected balls, so a rotation or
    // mirrored footprint cannot pass merely by changing the selected DDR pins.
    for (const ball of IMX6ULL_PAD_POSITIONS) {
      const obstacle = socPadByPin.get(`pin${ball.pinNumber}`)!
      expectPoint(obstacle.center, ball)
      expect(obstacle.layers).toEqual(["top"])
    }
    for (const ball of DDR3L_PAD_POSITIONS) {
      const obstacle = memoryPadByPin.get(`pin${ball.pinNumber}`)!
      const rotated =
        placement.rotation === 90 ? { x: -ball.y, y: ball.x } : ball
      expectPoint(obstacle.center, {
        x: placement.x + rotated.x,
        y: placement.y + rotated.y,
      })
      expect(obstacle.layers).toEqual(["top"])
    }
    const memoryCenter = {
      x:
        memoryObstacles.reduce((sum, obstacle) => sum + obstacle.center.x, 0) /
        96,
      y:
        memoryObstacles.reduce((sum, obstacle) => sum + obstacle.center.y, 0) /
        96,
    }
    expectPoint(memoryCenter, placement)
    observedMemoryCenters.add(
      `${memoryCenter.x.toFixed(6)},${memoryCenter.y.toFixed(6)}`,
    )

    const capturedConnectionByTrace = new Map<string, string>()
    for (const definition of IMX6ULL_SIGNAL_CONNECTIONS) {
      const socPad = socPadByPin.get(`pin${definition.socPinNumber}`)!
      const memoryPad = memoryPadByPin.get(`pin${definition.memoryPinNumber}`)!
      const connection = [...connectionByName.values()].find((candidate) =>
        candidate.pointsToConnect.some(
          (point) =>
            point.pcb_port_id === socPad.circuitJsonMetadata?.pcb_port_id,
        ),
      )!
      expect(connection.pointsToConnect).toHaveLength(2)
      const sourcePoint = connection.pointsToConnect.find(
        (point) =>
          point.pcb_port_id === socPad.circuitJsonMetadata?.pcb_port_id,
      )!
      const sourceBall = IMX6ULL_PAD_POSITIONS.find(
        (ball) => ball.ballName === definition.socBall,
      )!
      expectPoint(sourcePoint, sourceBall)
      expect(sourcePoint).toMatchObject({ layer: "top" })
      const memoryBall = DDR3L_PAD_POSITIONS.find(
        (ball) => ball.ballName === definition.memoryBall,
      )!
      expect(memoryBall.pinNumber).toBe(definition.memoryPinNumber)
      expect(connection.source_trace_id).toBeDefined()
      // Core substitutes a boundary point into the fanout connection; retain
      // the external RAM endpoint through its original source-trace identity.
      expect(memoryPad.connectedTo).toContain(connection.source_trace_id!)
      expect(socPad.connectedTo).toContain(connection.source_trace_id!)
      expect(
        signalBuses.find((bus) => bus.busId === definition.busName)
          ?.connectionNames,
      ).toContain(connection.name)
      capturedConnectionByTrace.set(definition.traceName, connection.name)
    }
    expect(capturedConnectionByTrace.size).toBe(49)

    for (const definition of IMX6ULL_PLANE_DROPS) {
      const socPad = socPadByPin.get(`pin${definition.pinNumber}`)!
      const connection = [...connectionByName.values()].find((candidate) =>
        candidate.pointsToConnect.some(
          (point) =>
            point.pcb_port_id === socPad.circuitJsonMetadata?.pcb_port_id,
        ),
      )!
      expect(connection.pointsToConnect).toHaveLength(1)
      expectPoint(connection.pointsToConnect[0]!, socPad.center)
      const bus = planeBuses.find((candidate) =>
        candidate.connectionNames.includes(connection.name),
      )!
      expect(bus.connectionNames).toEqual([connection.name])
      expect(bus.termination?.type).toBe("plane")
      if (bus.termination?.type !== "plane")
        throw new Error("Expected a plane drop")
      expect(bus.termination.layer).toBe(definition.layer)
    }

    for (const definition of IMX6ULL_SIGNAL_BUSES) {
      const bus = signalBuses.find(
        (candidate) => candidate.busId === definition.name,
      )!
      expect(new Set(bus.connectionNames)).toEqual(
        new Set(
          definition.connections.map(
            (traceName) => capturedConnectionByTrace.get(traceName)!,
          ),
        ),
      )
      expect(bus.allowedLayers).toEqual([...definition.preferredLayers])
      expect(bus.maxLengthSkew).toBe(definition.maxLengthSkew)
      expect(bus.exitPosition).toBe(
        sample.signalBusExitPositions[definition.name],
      )
      expect(
        bus.exitPosition?.startsWith(EDGE_PREFIX[directionCase.exitEdge]),
      ).toBe(true)
      expect(Object.keys(bus.connectionExitTargets ?? {})).toHaveLength(
        definition.connections.length,
      )
      for (const [connectionName, target] of Object.entries(
        bus.connectionExitTargets ?? {},
      )) {
        expect(bus.connectionNames).toContain(connectionName)
        expect(bus.allowedLayers).toContain(target.layer)
        switch (directionCase.exitEdge) {
          case "top":
            expect(target.y).toBeGreaterThan(sharedBoundary.maxY)
            break
          case "right":
            expect(target.x).toBeGreaterThan(sharedBoundary.maxX)
            break
          case "bottom":
            expect(target.y).toBeLessThan(sharedBoundary.minY)
            break
          case "left":
            expect(target.x).toBeLessThan(sharedBoundary.minX)
            break
        }
      }
    }
    for (const pair of IMX6ULL_DIFFERENTIAL_PAIRS) {
      expect(simpleRouteJson.differentialPairs).toContainEqual({
        connectionNames: [
          capturedConnectionByTrace.get(pair.positiveConnection)!,
          capturedConnectionByTrace.get(pair.negativeConnection)!,
        ],
        lengthTolerance: pair.lengthTolerance,
      })
    }
    expect(() => new FanoutSolver(simpleRouteJson, solverOptions)).not.toThrow()
  }
  expect(observedMemoryCenters.size).toBe(12)
}, 120_000)
