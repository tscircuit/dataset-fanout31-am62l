import { expect, test } from "bun:test"
import type { ImplicitBreakoutPointSolverInput } from "@tscircuit/props"
import { createT113s3BreakoutPlacement } from "../lib/t113s3-breakout-placement"

const endpoint = (connectionId: string, x: number, y: number) => ({
  connectionId,
  endpoints: [{ regionId: "soc", position: { x, y } }],
})
const input: ImplicitBreakoutPointSolverInput = {
  regions: [
    {
      regionId: "soc",
      bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
      edge: "left",
    },
  ],
  connections: [
    endpoint("l", -7, 0),
    endpoint("r", 7, 0),
    endpoint("b", 0, -7),
    {
      type: "differential",
      connections: [endpoint("dp", 0, 7), endpoint("dn", 1, 7)],
    },
  ],
  buses: [
    { busId: "left", connectionIds: ["l"], targetLayers: ["top"] },
    { busId: "right", connectionIds: ["r"], targetLayers: ["top"] },
    { busId: "bottom", connectionIds: ["b"], targetLayers: ["inner6"] },
    {
      busId: "usb",
      connectionIds: ["dp", "dn"],
      targetLayers: ["top", "inner6"],
    },
  ],
  boundaryPointSpacing: 0.5,
}
const exits = {
  left: "leftside_center",
  right: "rightside_center",
  bottom: "bottomside_center",
  usb: "topside_center",
} as const

test("edge-partitioned winding honors each bus despite core's single preferred edge", async () => {
  const { breakoutPoints: points } =
    await createT113s3BreakoutPlacement(exits)(input)
  expect(points).toHaveLength(5)
  expect(new Set(points.map((p) => p.connectionId)).size).toBe(5)
  expect(points.find((p) => p.connectionId === "l")?.x).toBe(-10)
  expect(points.find((p) => p.connectionId === "r")?.x).toBe(10)
  expect(points.find((p) => p.connectionId === "b")).toMatchObject({
    y: -10,
    layer: "inner6",
  })
  const positive = points.find((p) => p.connectionId === "dp")!,
    negative = points.find((p) => p.connectionId === "dn")!
  expect(positive.y).toBe(10)
  expect(negative.y).toBe(10)
  expect(positive.layer).toBe(negative.layer)
  expect(Math.abs(positive.x - negative.x)).toBeCloseTo(0.5, 8)
})

test("edge partitioning rejects incomplete declarations and split differential pairs", () => {
  expect(() => createT113s3BreakoutPlacement({})(input)).toThrow(
    "Missing T113-S3 edge",
  )
  expect(() =>
    createT113s3BreakoutPlacement(exits)({
      ...input,
      buses: input.buses.filter((b) => b.busId !== "left"),
    }),
  ).toThrow("Incomplete T113-S3 boundary placement")
  expect(() =>
    createT113s3BreakoutPlacement(exits)({
      ...input,
      buses: [
        ...input.buses.filter((b) => b.busId !== "usb"),
        { busId: "usb", connectionIds: ["dp"], targetLayers: ["top"] },
        { busId: "right", connectionIds: ["dn"], targetLayers: ["top"] },
      ],
    }),
  ).toThrow("Differential pair cannot span")
})
