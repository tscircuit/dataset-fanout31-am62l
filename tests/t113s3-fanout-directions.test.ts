import { expect, test } from "bun:test"
import { FanoutSolver } from "@tscircuit/fanout-solver"
import type { T113s3FanoutSample } from "../lib/create-t113s3-fanout-sample"
import { T113S3_PAD_POSITIONS } from "../lib/t113s3-footprint"
import { T113S3_TARGET_PADS } from "../lib/t113s3-targets"
import {
  T113S3_PLANE_DROPS,
  T113S3_SIGNAL_CONNECTIONS,
  T113S3_SIGNAL_BUSES,
  T113S3_DIFFERENTIAL_PAIRS,
} from "../lib/t113s3-buses"
import { T113S3_SAMPLE_DEFINITIONS } from "../samples"

type RouteJson = T113s3FanoutSample["simpleRouteJson"]
type Obstacle = RouteJson["obstacles"][number] & {
  circuitJsonMetadata?: { source_port_name?: string; pcb_port_id?: string }
}
type Connection = RouteJson["connections"][number] & {
  source_trace_id?: string
}
const rotate = (x: number, y: number, rotation: number) =>
  rotation === 90
    ? { x: -y, y: x }
    : rotation === 180
      ? { x: -x, y: -y }
      : rotation === 270
        ? { x: y, y: -x }
        : { x, y }
const naturalEdges: Record<string, string> = {
  GPIOB: "right",
  GPIOC: "left",
  GPIOD_0_9: "bottom",
  GPIOD_10_22: "right",
  GPIOE: "bottom",
  GPIOF: "left",
  GPIOG: "top",
  USB0: "top",
  USB1: "top",
  MICIN3: "right",
}
const expectPoint = (
  actual: { x: number; y: number },
  x: number,
  y: number,
) => {
  expect(actual.x).toBeCloseTo(x, 8)
  expect(actual.y).toBeCloseTo(y, 8)
}

test("all 12 T113-S3 captures escape every non-NC lead and drop each supply/ground to its own plane", async () => {
  expect(T113S3_SAMPLE_DEFINITIONS).toHaveLength(12)
  const layouts = new Set<string>()
  for (const [index, definition] of T113S3_SAMPLE_DEFINITIONS.entries()) {
    const s = await definition.createSample()
    expect(s.id.startsWith(`${index + 49}-t113s3-`)).toBe(true)
    const srj = s.simpleRouteJson,
      options = s.solverOptions
    expect(srj.connections).toHaveLength(128)
    expect(srj.obstacles).toHaveLength(235)
    expect(srj.layerCount).toBe(8)
    for (const [key, value] of Object.entries({
      minX: -10.45,
      maxX: 10.45,
      minY: -10.45,
      maxY: 10.45,
    })) {
      expect(
        options.sharedBoundary?.[key as "minX" | "maxX" | "minY" | "maxY"],
      ).toBeCloseTo(value, 8)
    }
    expect(options.escapeLayers).toEqual(["top", "inner6", "bottom"])
    const buses = options.buses ?? []
    expect(buses).toHaveLength(60)
    const planes = buses.filter((b) => b.termination?.type === "plane")
    const signals = buses.filter((b) => b.termination?.type !== "plane")
    expect(planes).toHaveLength(22)
    expect(signals).toHaveLength(38)
    expect(new Set(buses.flatMap((b) => b.connectionNames))).toEqual(
      new Set(srj.connections.map((c) => c.name)),
    )
    expect(buses.flatMap((b) => b.connectionNames)).toHaveLength(128)
    const groups = Map.groupBy(
      srj.obstacles as Obstacle[],
      (p) => p.componentId,
    )
    expect(groups.size).toBe(5)
    const soc = [...groups.values()].find((p) => p.length === 129)!
    const targets = [...groups.values()].filter((p) => p.length !== 129).flat()
    expect(soc).toHaveLength(129)
    expect(targets).toHaveLength(106)
    const socByPin = new Map(
      soc.map((p) => [p.circuitJsonMetadata?.source_port_name, p]),
    )
    const targetsByPin = new Map(
      targets.map((p) => [p.circuitJsonMetadata?.source_port_name, p]),
    )
    const rotation = [0, 270, 180, 90][Math.floor(index / 3)]!
    for (const pad of T113S3_PAD_POSITIONS) {
      const obstacle = socByPin.get(`pin${pad.pinNumber}`)!
      const point = rotate(pad.x, pad.y, rotation)
      expectPoint(obstacle.center, point.x, point.y)
      expect(obstacle.width).toBeCloseTo(
        rotation % 180 === 0 ? pad.width : pad.height,
        8,
      )
      expect(obstacle.height).toBeCloseTo(
        rotation % 180 === 0 ? pad.height : pad.width,
        8,
      )
      expect(obstacle.layers).toEqual(["top"])
    }
    const offset = ((index % 3) - 1) * 0.75
    for (const pad of T113S3_TARGET_PADS) {
      const base = {
        top: { x: pad.x + offset, y: 18 },
        right: { x: 18, y: pad.x - offset },
        bottom: { x: pad.x - offset, y: -18 },
        left: { x: -18, y: pad.x + offset },
      }[pad.edge]
      const point = rotate(base.x, base.y, rotation)
      const obstacle = targetsByPin.get(`pin${pad.pinNumber}`)!
      expectPoint(obstacle.center, point.x, point.y)
    }
    const connectionForPin = (pinNumber: number) => {
      const pad = socByPin.get(`pin${pinNumber}`)!
      return (srj.connections as Connection[]).filter((c) =>
        c.pointsToConnect.some(
          (p) => p.pcb_port_id === pad.circuitJsonMetadata?.pcb_port_id,
        ),
      )
    }
    expect(connectionForPin(106)).toHaveLength(0)
    expect(targetsByPin.has("pin106")).toBe(false)
    const traceMap = new Map<string, string>()
    for (const c of T113S3_SIGNAL_CONNECTIONS) {
      const matches = connectionForPin(c.pinNumber)
      expect(matches).toHaveLength(1)
      const captured = matches[0]!
      expect(captured.pointsToConnect).toHaveLength(2)
      expect(captured.source_trace_id).toBeDefined()
      expect(targetsByPin.get(`pin${c.pinNumber}`)?.connectedTo).toContain(
        captured.source_trace_id!,
      )
      expect(
        signals.find((b) => b.busId === c.busName)?.connectionNames,
      ).toContain(captured.name)
      traceMap.set(c.traceName, captured.name)
    }
    for (const p of T113S3_PLANE_DROPS) {
      const matches = connectionForPin(p.pinNumber)
      expect(matches).toHaveLength(1)
      const c = matches[0]!
      expect(c.pointsToConnect).toHaveLength(1)
      const bus = planes.find((b) => b.connectionNames.includes(c.name))!
      expect(bus.termination).toEqual({ type: "plane", layer: p.layer })
      expect(bus.connectionNames).toEqual([c.name])
      expect(targetsByPin.has(`pin${p.pinNumber}`)).toBe(false)
    }
    for (const definition of T113S3_SIGNAL_BUSES) {
      const bus = signals.find((b) => b.busId === definition.name)!
      expect(bus.allowedLayers).toEqual(["top", "inner6", "bottom"])
      expect(bus.exitPosition).toBe(s.signalBusExitPositions[definition.name])
      const baseEdge =
        naturalEdges[definition.name] ??
        ["left", "bottom", "right", "top"][
          Math.floor((definition.pins[0]! - 1) / 32)
        ]!
      const edgeOrder = ["top", "left", "bottom", "right"]
      const edge = edgeOrder[(edgeOrder.indexOf(baseEdge) + rotation / 90) % 4]!
      expect(bus.exitPosition?.startsWith(`${edge}side_`)).toBe(true)
      expect(new Set(bus.connectionNames)).toEqual(
        new Set(definition.connections.map((c) => traceMap.get(c)!)),
      )
      expect(Object.keys(bus.connectionExitTargets ?? {})).toHaveLength(
        definition.connections.length,
      )
      for (const target of Object.values(bus.connectionExitTargets ?? {})) {
        expect(bus.allowedLayers).toContain(target.layer)
        if (edge === "top") expect(target.y).toBeGreaterThan(10.45)
        if (edge === "right") expect(target.x).toBeGreaterThan(10.45)
        if (edge === "bottom") expect(target.y).toBeLessThan(-10.45)
        if (edge === "left") expect(target.x).toBeLessThan(-10.45)
      }
    }
    expect(
      new Set(signals.map((b) => b.exitPosition?.split("side_")[0])).size,
    ).toBe(4)
    expect(srj.differentialPairs).toHaveLength(3)
    for (const pair of T113S3_DIFFERENTIAL_PAIRS)
      expect(srj.differentialPairs).toContainEqual({
        connectionNames: [
          traceMap.get(pair.positiveConnection)!,
          traceMap.get(pair.negativeConnection)!,
        ],
        lengthTolerance: 0.25,
      })
    layouts.add(JSON.stringify(s.signalBusExitPositions))
    expect(() => new FanoutSolver(srj, options)).not.toThrow()
  }
  expect(layouts.size).toBe(12)
}, 120_000)
