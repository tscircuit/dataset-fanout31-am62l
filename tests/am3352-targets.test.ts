import { expect, test } from "bun:test"
import { AM3352_TARGET_PADS, AM3352_TARGET_EDGES } from "../lib/am3352-targets"
import {
  AM3352_SIGNAL_BUSES,
  AM3352_DIFFERENTIAL_PAIRS,
  AM3352_SIGNAL_CONNECTIONS,
} from "../lib/am3352-buses"

test("external destinations keep each bus contiguous and every differential pair adjacent", () => {
  for (const edge of AM3352_TARGET_EDGES) {
    const pads = AM3352_TARGET_PADS.filter((p) => p.edge === edge)
    for (const bus of AM3352_SIGNAL_BUSES.filter((b) => b.exitEdge === edge)) {
      const indexes = pads.flatMap((p, i) =>
        p.busName === bus.name ? [i] : [],
      )
      expect(indexes).toHaveLength(bus.pins.length)
      expect(indexes.at(-1)! - indexes[0]! + 1).toBe(bus.pins.length)
      expect(
        pads.filter((p) => p.busName === bus.name).map((p) => p.pinNumber),
      ).toEqual(bus.pins)
    }
  }
  for (const pair of AM3352_DIFFERENTIAL_PAIRS) {
    const pads = [pair.positiveConnection, pair.negativeConnection].map(
      (name) => {
        const pin = AM3352_SIGNAL_CONNECTIONS.find(
          (c) => c.traceName === name,
        )!.pinNumber
        return AM3352_TARGET_PADS.find((p) => p.pinNumber === pin)!
      },
    )
    expect(pads[0]!.edge).toBe(pads[1]!.edge)
    expect(Math.abs(pads[0]!.x - pads[1]!.x)).toBeCloseTo(0.5)
  }
})
