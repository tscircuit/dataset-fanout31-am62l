import { expect, test } from "bun:test"
import { createAm62lDdr4FanoutSample } from "../lib/create-am62l-ddr4-fanout-sample"

for (const side of ["processor", "memory"] as const) {
  test(`captures one isolated AM62L DDR4 ${side} fanout`, async () => {
    const sample = await createAm62lDdr4FanoutSample(side)
    expect(sample.simpleRouteJson.connections).toHaveLength(49)
    expect(sample.simpleRouteJson.obstacles).toHaveLength(
      side === "processor" ? 422 : 145,
    )
    expect(sample.simpleRouteJson.traces ?? []).toHaveLength(0)
    expect(Reflect.get(sample.simpleRouteJson, "allowBlindAndBuriedVias")).toBe(
      false,
    )
    expect(Reflect.get(sample.simpleRouteJson, "allowViaInPad")).not.toBe(true)
    expect(sample.solverOptions.allowBlindAndBuriedVias).toBe(false)
    expect(sample.solverOptions.buses).toHaveLength(23)

    const busConnections =
      sample.solverOptions.buses?.flatMap((bus) => bus.connectionNames) ?? []
    expect(busConnections).toHaveLength(49)
    expect(new Set(busConnections)).toEqual(
      new Set(
        sample.simpleRouteJson.connections.map((connection) => connection.name),
      ),
    )
  })
}
