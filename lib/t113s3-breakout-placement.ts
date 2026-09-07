import type { FanoutExitPosition } from "@tscircuit/fanout-solver"
import type {
  ImplicitBreakoutConnection,
  ImplicitBreakoutPointSolverFn,
} from "@tscircuit/props"
import { WindingBreakoutSolver } from "@tscircuit/winding-breakout-point-solver"

/** Core's default winding pass has one edge per region. Partition this single
 * source region by declared bus edge, then let the same winding solver place
 * its points. No pin coordinates, ordering, or layer assignments are invented.
 * Plane drops are absent from the implicit boundary-point input.
 */
export function createT113s3BreakoutPlacement(
  exits: Readonly<Record<string, Exclude<FanoutExitPosition, "center">>>,
): ImplicitBreakoutPointSolverFn {
  return (input) => {
    if (input.regions.length !== 1)
      throw new Error("T113-S3 edge placement expects one source region")
    const region = input.regions[0]!
    const toConnection = (connection: ImplicitBreakoutConnection) => ({
      id: connection.connectionId,
      endpoints: connection.endpoints,
    })
    const assigned = new Set<string>()
    const breakoutPoints = []
    for (const edge of ["top", "right", "bottom", "left"] as const) {
      const buses = input.buses.filter((bus) => {
        const exit = exits[bus.busId]
        if (!exit) throw new Error(`Missing T113-S3 edge for bus ${bus.busId}`)
        return exit.startsWith(`${edge}side_`)
      })
      if (!buses.length) continue
      const ids = new Set(buses.flatMap((b) => [...b.connectionIds]))
      const connections = input.connections
        .filter((c) => {
          const members = "type" in c ? c.connections : [c]
          const included = members.filter((m) => ids.has(m.connectionId))
          if (included.length && included.length !== members.length)
            throw new Error("Differential pair cannot span T113-S3 edges")
          return included.length > 0
        })
        .map((c) =>
          "type" in c
            ? {
                type: "differential" as const,
                connections: [
                  toConnection(c.connections[0]),
                  toConnection(c.connections[1]),
                ] as const,
              }
            : toConnection(c),
        )
      const solver = new WindingBreakoutSolver({
        regions: [{ id: region.regionId, bounds: region.bounds, edge }],
        connections,
        buses: buses.map((b) => ({
          id: b.busId,
          connectionIds: b.connectionIds,
          preferredLayers: b.targetLayers,
        })),
        boundaryPointSpacing: input.boundaryPointSpacing,
      })
      solver.solve()
      const points = solver.getOutput().breakoutPoints
      for (const p of points) {
        if (assigned.has(p.connectionId))
          throw new Error(
            `Duplicate T113-S3 boundary connection ${p.connectionId}`,
          )
        assigned.add(p.connectionId)
      }
      breakoutPoints.push(...points)
    }
    const expected = input.connections.flatMap((c) =>
      "type" in c ? [...c.connections] : [c],
    )
    if (
      expected.length !== assigned.size ||
      expected.some((c) => !assigned.has(c.connectionId))
    )
      throw new Error("Incomplete T113-S3 boundary placement")
    return { breakoutPoints }
  }
}
