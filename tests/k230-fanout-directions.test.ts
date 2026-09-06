import { K230_SAMPLE_DEFINITIONS } from "../samples"
import { expect, test } from "bun:test"
import { FanoutSolver } from "@tscircuit/fanout-solver"
import { type K230FanoutSample } from "../lib/create-k230-fanout-sample"
import { K230_LPDDR4_SIGNAL_BALL_MAP } from "../lib/k230-ball-map"
import {
  K230_DIFFERENTIAL_PAIRS,
  K230_PLANE_DROPS,
  K230_SIGNAL_BUSES,
  K230_SIGNAL_CONNECTIONS,
} from "../lib/k230-buses"
import { K230_FANOUT_DIRECTION_CASES } from "../lib/k230-fanout-directions"
import { K230_PAD_POSITIONS } from "../lib/k230-footprint"
import {
  K230_LPDDR4_PAD_POSITIONS,
  K230_LPDDR4_SIGNAL_BALLS,
} from "../lib/k230-lpddr4-footprint"

type CapturedRouteJson = K230FanoutSample["simpleRouteJson"] & {
  allowViaInPad?: boolean
}
type CapturedObstacle = CapturedRouteJson["obstacles"][number] & {
  circuitJsonMetadata?: { source_port_name?: string; pcb_port_id?: string }
}
type CapturedConnection = CapturedRouteJson["connections"][number] & {
  source_trace_id?: string
}

// Independent placement expectations: a pair of physical RAM packages moves
// 26 mm toward each edge, with offsets -6/0/+6 mm along that edge. Each RAM
// is another 12 mm from the pair center in the transverse direction.
const MEMORY_PAIR_PLACEMENTS = {
  topside_left: { x: -6, y: 26, rotation: 90 },
  topside_center: { x: 0, y: 26, rotation: 90 },
  topside_right: { x: 6, y: 26, rotation: 90 },
  rightside_top: { x: 26, y: 6, rotation: 0 },
  rightside_center: { x: 26, y: 0, rotation: 0 },
  rightside_bottom: { x: 26, y: -6, rotation: 0 },
  bottomside_right: { x: 6, y: -26, rotation: 90 },
  bottomside_center: { x: 0, y: -26, rotation: 90 },
  bottomside_left: { x: -6, y: -26, rotation: 90 },
  leftside_bottom: { x: -26, y: -6, rotation: 0 },
  leftside_center: { x: -26, y: 0, rotation: 0 },
  leftside_top: { x: -26, y: 6, rotation: 0 },
} as const

const EDGE_POSITIONS = {
  top: ["topside_left", "topside_center", "topside_right"],
  right: ["rightside_top", "rightside_center", "rightside_bottom"],
  bottom: ["bottomside_right", "bottomside_center", "bottomside_left"],
  left: ["leftside_bottom", "leftside_center", "leftside_top"],
} as const

const EXPECTED_BUS_RULES = {
  BYTE0: { layers: ["top", "inner4"], skew: 8, band: -1 },
  BYTE1: { layers: ["inner5", "bottom"], skew: 8, band: 1 },
  CA_CTRL: { layers: ["inner6"], skew: 15, band: 0 },
  CLOCK: { layers: ["inner5"], skew: 0.25, band: 0 },
  DQS0: { layers: ["inner5"], skew: 0.25, band: -1 },
  DQS1: { layers: ["inner5"], skew: 0.25, band: 1 },
  DMI0: { layers: ["inner5"], skew: undefined, band: -1 },
  DMI1: { layers: ["inner5"], skew: undefined, band: 1 },
  RESET: { layers: ["inner6"], skew: undefined, band: 0 },
} as const

const expectPoint = (
  actual: { x: number; y: number },
  expected: { x: number; y: number },
) => {
  expect(actual.x).toBeCloseTo(expected.x, 8)
  expect(actual.y).toBeCloseTo(expected.y, 8)
}
const centerOf = (pads: readonly CapturedObstacle[]) => ({
  x: pads.reduce((sum, pad) => sum + pad.center.x, 0) / pads.length,
  y: pads.reduce((sum, pad) => sum + pad.center.y, 0) / pads.length,
})
const paddedRamBounds = (pads: readonly CapturedObstacle[]) => ({
  // The RAM has 0.40 mm copper lands and a 3.5 mm breakout margin.
  minX: Math.min(...pads.map((pad) => pad.center.x)) - 0.2 - 3.5,
  maxX: Math.max(...pads.map((pad) => pad.center.x)) + 0.2 + 3.5,
  minY: Math.min(...pads.map((pad) => pad.center.y)) - 0.2 - 3.5,
  maxY: Math.max(...pads.map((pad) => pad.center.y)) + 0.2 + 3.5,
})
const boundsOverlap = (
  a: { minX: number; maxX: number; minY: number; maxY: number },
  b: { minX: number; maxX: number; minY: number; maxY: number },
) => a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY
const padMap = (pads: readonly CapturedObstacle[]) =>
  new Map(pads.map((pad) => [pad.circuitJsonMetadata?.source_port_name, pad]))

// These formulas use manufacturer ball names, not the footprint's computed
// positions, so a mirrored or wrongly compressed grid cannot validate itself.
const sourceBallPosition = (ballName: string) => {
  const match = /^([A-Z]+)(\d+)$/.exec(ballName)!
  const row = "ABCDEFGHJKLMNPRTUVWY".indexOf(match[1]!)
  return { x: (Number(match[2]) - 10.5) * 0.65, y: (9.5 - row) * 0.65 }
}
const memoryBallPosition = (ballName: string) => {
  const match = /^([A-Z]+)(\d+)$/.exec(ballName)!
  const rows = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "J",
    "K",
    "L",
    "M",
    "N",
    "P",
    "R",
    "T",
    "U",
    "V",
    "W",
    "Y",
    "AA",
    "AB",
  ]
  return {
    x: (Number(match[2]) - 6.5) * 0.8,
    y: (10.5 - rows.indexOf(match[1]!)) * 0.65,
  }
}

const expectedSignalNames = [
  ...(["A", "B"] as const).flatMap((channel) => [
    ...Array.from({ length: 16 }, (_, bit) => `DQ${channel}${bit}`),
    ...Array.from({ length: 6 }, (_, bit) => `CA${channel}${bit}`),
    `CS${channel}0`,
    `CKE${channel}0`,
    `CLK${channel}P`,
    `CLK${channel}N`,
    `DQS${channel}0P`,
    `DQS${channel}0N`,
    `DQS${channel}1P`,
    `DQS${channel}1N`,
    `DMI${channel}0`,
    `DMI${channel}1`,
  ]),
  "RESET_N",
]

const expectedMemorySignal = (socSignal: string) => {
  if (socSignal === "RESET_N") return "RESET_N"
  if (/^CLK[AB]P$/.test(socSignal)) return "CK"
  if (/^CLK[AB]N$/.test(socSignal)) return "CK_N"
  return socSignal
    .replace(/^(DQ|CA|CS|CKE|DMI|DQS)[AB]/, "$1")
    .replace(/^(DQS\d)P$/, "$1")
    .replace(/^(DQS\d)N$/, "$1_N")
}

test("all 12 K230 cases retain two real x16 RAM channels around a fixed 390-ball SoC", async () => {
  expect(K230_FANOUT_DIRECTION_CASES).toHaveLength(12)
  expect(
    new Set(K230_FANOUT_DIRECTION_CASES.map((sample) => sample.id)).size,
  ).toBe(12)
  expect(
    new Set(K230_SIGNAL_CONNECTIONS.map((connection) => connection.socSignal)),
  ).toEqual(new Set(expectedSignalNames))
  expect(K230_SIGNAL_CONNECTIONS).toHaveLength(65)
  expect(K230_SIGNAL_BUSES).toHaveLength(17)
  expect(K230_DIFFERENTIAL_PAIRS).toHaveLength(6)
  const observedPairCenters = new Set<string>()
  const observedMemoryCenters = new Set<string>()
  let originalBoundary: K230FanoutSample["solverOptions"]["sharedBoundary"]

  for (const direction of K230_FANOUT_DIRECTION_CASES) {
    const definition = K230_SAMPLE_DEFINITIONS.find(
      (definition) => definition.exitPosition === direction.exitPosition,
    )!
    const sample = await definition.createSample()
    const { simpleRouteJson, solverOptions } = sample
    const sharedBoundary = solverOptions.sharedBoundary
    if (!sharedBoundary) throw new Error("Missing core-generated K230 boundary")
    const buses = solverOptions.buses ?? []
    const planeBuses = buses.filter((bus) => bus.termination?.type === "plane")
    const signalBuses = buses.filter((bus) => bus.termination?.type !== "plane")
    const connections = simpleRouteJson.connections as CapturedConnection[]
    const connectionByName = new Map(
      connections.map((connection) => [connection.name, connection]),
    )

    expect(sample.id).toBe(direction.id)
    expect(sample.directionCase).toEqual(direction)
    expect(connections).toHaveLength(171)
    expect(simpleRouteJson.obstacles).toHaveLength(790)
    expect(buses).toHaveLength(123)
    expect(planeBuses).toHaveLength(106)
    expect(signalBuses).toHaveLength(17)
    expect(signalBuses.flatMap((bus) => bus.connectionNames)).toHaveLength(65)
    expect(new Set(buses.flatMap((bus) => bus.connectionNames)).size).toBe(171)
    expect(new Set(buses.flatMap((bus) => bus.connectionNames))).toEqual(
      new Set(connectionByName.keys()),
    )
    expect(simpleRouteJson.differentialPairs).toHaveLength(6)
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
    expect(Object.keys(solverOptions.busDirections ?? {})).toHaveLength(106)
    expect(
      planeBuses.filter(
        (bus) =>
          bus.termination?.type === "plane" &&
          bus.termination.layer === "inner1",
      ),
    ).toHaveLength(101)
    expect(
      planeBuses.filter(
        (bus) =>
          bus.termination?.type === "plane" &&
          bus.termination.layer === "inner2",
      ),
    ).toHaveLength(5)
    originalBoundary ??= sharedBoundary
    expect(sharedBoundary).toEqual(originalBoundary)
    // Eight millimeters around the 12.65 mm copper envelope allows all
    // 43 corner-band exits without shrinking physical clearances.
    expectPoint(
      { x: sharedBoundary.minX, y: sharedBoundary.minY },
      { x: -14.325, y: -14.325 },
    )
    expectPoint(
      { x: sharedBoundary.maxX, y: sharedBoundary.maxY },
      { x: 14.325, y: 14.325 },
    )

    const components = Map.groupBy(
      simpleRouteJson.obstacles as CapturedObstacle[],
      (obstacle) => obstacle.componentId,
    )
    expect(components.size).toBe(3)
    const socPads = [...components.values()].find(
      (pads) => pads.length === 390,
    )!
    const ramGroups = [...components.values()].filter(
      (pads) => pads.length === 200,
    )
    expect(socPads).toHaveLength(390)
    expect(ramGroups).toHaveLength(2)
    const ramBounds = ramGroups.map(paddedRamBounds)
    for (const bounds of ramBounds) {
      expect(boundsOverlap(bounds, sharedBoundary)).toBe(false)
      expect(bounds.minX).toBeGreaterThan(-36)
      expect(bounds.maxX).toBeLessThan(36)
      expect(bounds.minY).toBeGreaterThan(-36)
      expect(bounds.maxY).toBeLessThan(36)
    }
    expect(boundsOverlap(ramBounds[0]!, ramBounds[1]!)).toBe(false)
    const socPadByPin = padMap(socPads)
    const pairPlacement = MEMORY_PAIR_PLACEMENTS[direction.exitPosition]
    const memories = new Map<
      string,
      Map<string | undefined, CapturedObstacle>
    >()

    for (const ball of K230_PAD_POSITIONS) {
      const pad = socPadByPin.get(`pin${ball.pinNumber}`)!
      expectPoint(pad.center, sourceBallPosition(ball.ballName))
      expect(pad.layers).toEqual(["top"])
    }
    for (const [index, componentName] of ["U2", "U3"].entries()) {
      const transverseOffset = index === 0 ? -12 : 12
      const placement = {
        x:
          pairPlacement.x +
          (pairPlacement.rotation === 90 ? transverseOffset : 0),
        y:
          pairPlacement.y +
          (pairPlacement.rotation === 0 ? transverseOffset : 0),
      }
      const ramPads = ramGroups.find((pads) => {
        const center = centerOf(pads)
        return (
          Math.abs(center.x - placement.x) < 1e-6 &&
          Math.abs(center.y - placement.y) < 1e-6
        )
      })!
      expect(ramPads).toHaveLength(200)
      const ramPadByPin = padMap(ramPads)
      memories.set(componentName, ramPadByPin)
      for (const ball of K230_LPDDR4_PAD_POSITIONS) {
        const position = memoryBallPosition(ball.ballName)
        const rotated =
          pairPlacement.rotation === 90
            ? { x: -position.y, y: position.x }
            : position
        const pad = ramPadByPin.get(`pin${ball.pinNumber}`)!
        expectPoint(pad.center, {
          x: placement.x + rotated.x,
          y: placement.y + rotated.y,
        })
        expect(pad.layers).toEqual(["top"])
      }
      const center = centerOf(ramPads)
      expectPoint(center, placement)
      observedMemoryCenters.add(`${center.x.toFixed(6)},${center.y.toFixed(6)}`)
    }
    const pairCenter = centerOf(ramGroups.flat())
    expectPoint(pairCenter, pairPlacement)
    observedPairCenters.add(
      `${pairCenter.x.toFixed(6)},${pairCenter.y.toFixed(6)}`,
    )

    const capturedConnectionByTrace = new Map<string, string>()
    const sourceTraceIds = new Set<string>()
    let verifiedMemoryEndpoints = 0
    for (const definition of K230_SIGNAL_CONNECTIONS) {
      const socPad = socPadByPin.get(`pin${definition.socPinNumber}`)!
      expect(K230_LPDDR4_SIGNAL_BALL_MAP[definition.socBall]).toBe(
        definition.socSignal,
      )
      const connection = connections.find((candidate) =>
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
      expectPoint(sourcePoint, sourceBallPosition(definition.socBall))
      expect(sourcePoint).toMatchObject({ layer: "top" })
      expect(connection.source_trace_id).toBeDefined()
      expect(socPad.connectedTo).toContain(connection.source_trace_id!)
      sourceTraceIds.add(connection.source_trace_id!)
      expect(
        signalBuses.find((bus) => bus.busId === definition.busName)
          ?.connectionNames,
      ).toContain(connection.name)
      const expectedEndpointCount = definition.socSignal === "RESET_N" ? 2 : 1
      expect(definition.memoryEndpoints).toHaveLength(expectedEndpointCount)
      for (const endpoint of definition.memoryEndpoints) {
        expect(endpoint.componentName).toBe(
          endpoint.channel === "A" ? "U2" : "U3",
        )
        if (definition.socSignal !== "RESET_N")
          expect(definition.socSignal).toMatch(
            new RegExp(`^(?:DQ|CA|CS|CKE|DMI|DQS|CLK)${endpoint.channel}`),
          )
        expect(expectedMemorySignal(definition.socSignal)).toBe(endpoint.signal)
        expect(endpoint.ball).toBe(K230_LPDDR4_SIGNAL_BALLS[endpoint.signal])
        const memoryBall = K230_LPDDR4_PAD_POSITIONS.find(
          (ball) => ball.ballName === endpoint.ball,
        )!
        expect(endpoint.pinNumber).toBe(memoryBall.pinNumber)
        const memoryPad = memories
          .get(endpoint.componentName)!
          .get(`pin${endpoint.pinNumber}`)!
        // Core replaces the downstream endpoint with a boundary target. The
        // original source trace must still connect the source and real RAM pad.
        expect(memoryPad.connectedTo).toContain(connection.source_trace_id!)
        verifiedMemoryEndpoints += 1
      }
      if (definition.socSignal === "RESET_N") {
        expect(definition.socBall).toBe("J16")
        const boundaryPoint = connection.pointsToConnect.find(
          (point) => point !== sourcePoint,
        )!
        expect(boundaryPoint).toMatchObject({
          layer: "inner6",
          pointId: expect.stringContaining("pcb_breakout_point_"),
        })
        expect(boundaryPoint.x).toBeGreaterThanOrEqual(
          sharedBoundary.minX - 0.001,
        )
        expect(boundaryPoint.x).toBeLessThanOrEqual(sharedBoundary.maxX + 0.001)
        expect(boundaryPoint.y).toBeGreaterThanOrEqual(
          sharedBoundary.minY - 0.001,
        )
        expect(boundaryPoint.y).toBeLessThanOrEqual(sharedBoundary.maxY + 0.001)
        const edgeCoordinate =
          direction.exitEdge === "top" || direction.exitEdge === "bottom"
            ? boundaryPoint.y
            : boundaryPoint.x
        const boundaryCoordinate = {
          top: sharedBoundary.maxY,
          right: sharedBoundary.maxX,
          bottom: sharedBoundary.minY,
          left: sharedBoundary.minX,
        }[direction.exitEdge]
        expect(Math.abs(edgeCoordinate - boundaryCoordinate)).toBeLessThan(
          0.001,
        )
        expect(
          definition.memoryEndpoints.map(
            (endpoint) => `${endpoint.componentName}.${endpoint.ball}`,
          ),
        ).toEqual(["U2.T11", "U3.T11"])
      }
      capturedConnectionByTrace.set(definition.traceName, connection.name)
    }
    expect(capturedConnectionByTrace.size).toBe(65)
    expect(sourceTraceIds.size).toBe(65)
    expect(verifiedMemoryEndpoints).toBe(66)

    for (const definition of K230_PLANE_DROPS) {
      const pad = socPadByPin.get(`pin${definition.pinNumber}`)!
      const connection = connections.find((candidate) =>
        candidate.pointsToConnect.some(
          (point) => point.pcb_port_id === pad.circuitJsonMetadata?.pcb_port_id,
        ),
      )!
      expect(connection.pointsToConnect).toHaveLength(1)
      expectPoint(connection.pointsToConnect[0]!, pad.center)
      const bus = planeBuses.find((candidate) =>
        candidate.connectionNames.includes(connection.name),
      )!
      expect(bus.connectionNames).toEqual([connection.name])
      if (bus.termination?.type !== "plane")
        throw new Error("Expected a plane drop")
      expect(bus.termination.layer).toBe(
        definition.pinSignal === "VSS" ? "inner1" : "inner2",
      )
      expect(bus.termination.layer).toBe(definition.layer)
    }
    for (const definition of K230_SIGNAL_BUSES) {
      const bus = signalBuses.find(
        (candidate) => candidate.busId === definition.name,
      )!
      const suffix = definition.name.replace(
        /^LP4_(?:[AB]_)?/,
        "",
      ) as keyof typeof EXPECTED_BUS_RULES
      const rule = EXPECTED_BUS_RULES[suffix]
      expect(new Set(bus.connectionNames)).toEqual(
        new Set(
          definition.connections.map(
            (traceName) => capturedConnectionByTrace.get(traceName)!,
          ),
        ),
      )
      expect(bus.allowedLayers).toEqual([...rule.layers])
      expect(bus.maxLengthSkew).toBe(rule.skew)
      expect(definition.preferredLayers).toEqual([...rule.layers])
      expect(definition.maxLengthSkew).toBe(rule.skew)
      const directionBand =
        EDGE_POSITIONS[direction.exitEdge].findIndex(
          (position) => position === direction.exitPosition,
        ) - 1
      const expectedExit =
        EDGE_POSITIONS[direction.exitEdge][
          Math.max(0, Math.min(2, rule.band + directionBand + 1))
        ]!
      expect(bus.exitPosition).toBe(expectedExit)
      expect(sample.signalBusExitPositions[definition.name]).toBe(expectedExit)
      const targetCount = Object.keys(bus.connectionExitTargets ?? {}).length
      if (definition.name === "LP4_RESET") {
        // A multicast net has two downstream RAM breakouts. Core may omit
        // its optional single-target guidance; its real endpoints and the
        // required SoC boundary connection are checked above.
        expect(targetCount).toBeLessThanOrEqual(1)
      } else {
        expect(targetCount).toBe(definition.connections.length)
      }
      for (const [connectionName, target] of Object.entries(
        bus.connectionExitTargets ?? {},
      )) {
        expect(bus.connectionNames).toContain(connectionName)
        expect(bus.allowedLayers).toContain(target.layer)
        switch (direction.exitEdge) {
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
    for (const pair of K230_DIFFERENTIAL_PAIRS) {
      expect(pair.lengthTolerance).toBe(0.25)
      expect(simpleRouteJson.differentialPairs).toContainEqual({
        connectionNames: [
          capturedConnectionByTrace.get(pair.positiveConnection)!,
          capturedConnectionByTrace.get(pair.negativeConnection)!,
        ],
        lengthTolerance: 0.25,
      })
    }
    expect(() => new FanoutSolver(simpleRouteJson, solverOptions)).not.toThrow()
  }
  expect(observedPairCenters.size).toBe(12)
  expect(observedMemoryCenters.size).toBe(24)
}, 120_000)
