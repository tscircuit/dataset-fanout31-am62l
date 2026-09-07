import { expect, test } from "bun:test"
import { FanoutSolver } from "@tscircuit/fanout-solver"
import type { Am3352FanoutSample } from "../lib/create-am3352-fanout-sample"
import { AM3352_PAD_POSITIONS } from "../lib/am3352-footprint"
import { AM3352_TARGET_PADS } from "../lib/am3352-targets"
import {
  AM3352_PLANE_DROPS,
  AM3352_SIGNAL_CONNECTIONS,
  AM3352_SIGNAL_BUSES,
  AM3352_DIFFERENTIAL_PAIRS,
} from "../lib/am3352-buses"
import { AM3352_SAMPLE_DEFINITIONS } from "../samples"

type RouteJson = Am3352FanoutSample["simpleRouteJson"]
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
  DDR_CA: "left",
  DDR_CLK: "left",
  DDR_BYTE0: "left",
  DDR_BYTE1: "left",
  LCD: "bottom",
  GPMC_AD: "bottom",
  GPMC_CONTROL: "bottom",
  GPMC_A: "right",
  ETHERNET: "right",
  MMC0: "right",
  USB0: "right",
  USB1: "right",
  SPI0: "top",
  I2C0: "top",
  UART0: "top",
  UART1: "top",
  MCASP0: "top",
  JTAG: "top",
  ADC: "top",
}
const expectPoint = (
  actual: { x: number; y: number },
  x: number,
  y: number,
) => {
  expect(actual.x).toBeCloseTo(x, 8)
  expect(actual.y).toBeCloseTo(y, 8)
}

test("all 12 AM3352BZCZD80 captures escape every non-NC lead and drop each supply/ground to its own plane", async () => {
  expect(AM3352_SAMPLE_DEFINITIONS).toHaveLength(12)
  const layouts = new Set<string>()
  for (const [index, definition] of AM3352_SAMPLE_DEFINITIONS.entries()) {
    const s = await definition.createSample()
    expect(s.id.startsWith(`${index + 61}-am3352-`)).toBe(true)
    const srj = s.simpleRouteJson,
      options = s.solverOptions
    expect(srj.connections).toHaveLength(322)
    expect(srj.obstacles).toHaveLength(529)
    expect(srj.layerCount).toBe(10)
    for (const [key, value] of Object.entries({
      minX: -9,
      maxX: 9,
      minY: -9,
      maxY: 9,
    })) {
      expect(
        options.sharedBoundary?.[key as "minX" | "maxX" | "minY" | "maxY"],
      ).toBeCloseTo(value, 8)
    }
    expect(options.escapeLayers).toEqual(["top", "inner7", "inner8", "bottom"])
    const buses = options.buses ?? []
    expect(buses).toHaveLength(165)
    const planes = buses.filter((b) => b.termination?.type === "plane")
    const signals = buses.filter((b) => b.termination?.type !== "plane")
    expect(planes).toHaveLength(117)
    expect(signals).toHaveLength(48)
    expect(new Set(buses.flatMap((b) => b.connectionNames))).toEqual(
      new Set(srj.connections.map((c) => c.name)),
    )
    expect(buses.flatMap((b) => b.connectionNames)).toHaveLength(322)
    const groups = Map.groupBy(
      srj.obstacles as Obstacle[],
      (p) => p.componentId,
    )
    expect(groups.size).toBe(5)
    const soc = [...groups.values()].find((p) => p.length === 324)!
    const targets = [...groups.values()].filter((p) => p.length !== 324).flat()
    expect(soc).toHaveLength(324)
    expect(targets).toHaveLength(205)
    const socByPin = new Map(
      soc.map((p) => [p.circuitJsonMetadata?.source_port_name, p]),
    )
    const targetsByPin = new Map(
      targets.map((p) => [p.circuitJsonMetadata?.source_port_name, p]),
    )
    const rotation = [0, 270, 180, 90][Math.floor(index / 3)]!
    for (const pad of AM3352_PAD_POSITIONS) {
      const obstacle = socByPin.get(`pin${pad.pinNumber}`)!
      const point = rotate(pad.x, pad.y, rotation)
      expectPoint(obstacle.center, point.x, point.y)
      expect(obstacle.width).toBeCloseTo(0.4, 8)
      expect(obstacle.height).toBeCloseTo(0.4, 8)
      expect(obstacle.layers).toEqual(["top"])
    }
    const offset = ((index % 3) - 1) * 0.75
    for (const pad of AM3352_TARGET_PADS) {
      const base = {
        top: { x: pad.x + offset, y: 25 },
        right: { x: 25, y: pad.x - offset },
        bottom: { x: pad.x - offset, y: -25 },
        left: { x: -25, y: pad.x + offset },
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
    for (const ncPin of [3, 203]) {
      expect(connectionForPin(ncPin)).toHaveLength(0)
      expect(targetsByPin.has(`pin${ncPin}`)).toBe(false)
    }
    const traceMap = new Map<string, string>()
    for (const c of AM3352_SIGNAL_CONNECTIONS) {
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
    for (const p of AM3352_PLANE_DROPS) {
      const matches = connectionForPin(p.pinNumber)
      expect(matches).toHaveLength(1)
      const c = matches[0]!
      expect(c.pointsToConnect).toHaveLength(1)
      const bus = planes.find((b) => b.connectionNames.includes(c.name))!
      expect(bus.termination).toEqual({ type: "plane", layer: p.layer })
      expect(bus.connectionNames).toEqual([c.name])
      expect(targetsByPin.has(`pin${p.pinNumber}`)).toBe(false)
    }
    for (const definition of AM3352_SIGNAL_BUSES) {
      const bus = signals.find((b) => b.busId === definition.name)!
      expect(bus.allowedLayers).toEqual(["top", "inner7", "inner8", "bottom"])
      expect(bus.exitPosition).toBe(s.signalBusExitPositions[definition.name])
      const pin = AM3352_PAD_POSITIONS[definition.pins[0]! - 1]!
      const nearest =
        Math.abs(pin.x) > Math.abs(pin.y)
          ? pin.x > 0
            ? "right"
            : "left"
          : pin.y > 0
            ? "top"
            : "bottom"
      const baseEdge = naturalEdges[definition.name] ?? nearest
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
        if (edge === "top") expect(target.y).toBeGreaterThan(9)
        if (edge === "right") expect(target.x).toBeGreaterThan(9)
        if (edge === "bottom") expect(target.y).toBeLessThan(-9)
        if (edge === "left") expect(target.x).toBeLessThan(-9)
      }
    }
    expect(
      new Set(signals.map((b) => b.exitPosition?.split("side_")[0])).size,
    ).toBe(4)
    expect(srj.differentialPairs).toHaveLength(5)
    for (const pair of AM3352_DIFFERENTIAL_PAIRS)
      expect(srj.differentialPairs).toContainEqual({
        connectionNames: [
          traceMap.get(pair.positiveConnection)!,
          traceMap.get(pair.negativeConnection)!,
        ],
        lengthTolerance: 0.1,
      })
    layouts.add(JSON.stringify(s.signalBusExitPositions))
    expect(() => new FanoutSolver(srj, options)).not.toThrow()
  }
  expect(layouts.size).toBe(12)
}, 240_000)
