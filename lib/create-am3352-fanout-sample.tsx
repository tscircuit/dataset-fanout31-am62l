import { createBusEdgeBreakoutPlacement } from "./bus-edge-breakout-placement"
import type {
  FanoutExitPosition,
  FanoutEdge,
  FanoutSolver,
  FanoutSolverOptions,
} from "@tscircuit/fanout-solver"
import { Fragment } from "react"
import {
  captureCoreFanoutInput,
  createBoardNoopAlgorithm,
} from "./capture-core-fanout"
import {
  AM3352_DIFFERENTIAL_PAIRS,
  AM3352_PLANE_DROPS,
  AM3352_POWER_PLANES,
  AM3352_ROUTING_LAYERS,
  AM3352_SIGNAL_BUSES,
  AM3352_SIGNAL_CONNECTIONS,
} from "./am3352-buses"
import {
  getAm3352FanoutDirectionCase,
  type Am3352FanoutDirectionCase,
} from "./am3352-fanout-directions"
import { Am3352 } from "./am3352-footprint"
import { Am3352Targets, AM3352_TARGET_EDGES } from "./am3352-targets"

export const AM3352_COMPLETE_CONNECTION_COUNT = 322
export const AM3352_COMPLETE_BUS_COUNT =
  AM3352_SIGNAL_BUSES.length + AM3352_PLANE_DROPS.length
export const AM3352_COMPLETE_OBSTACLE_COUNT =
  324 + AM3352_SIGNAL_CONNECTIONS.length
export const AM3352_SIGNAL_CONNECTION_COUNT = AM3352_SIGNAL_CONNECTIONS.length
export const AM3352_PLANE_DROP_COUNT = AM3352_PLANE_DROPS.length
export const AM3352_BREAKOUT_PADDING = 5

type BoundaryExitPosition = Exclude<FanoutExitPosition, "center">
export interface Am3352FanoutSample {
  id: string
  name: string
  description: string
  directionCase: Am3352FanoutDirectionCase
  signalBusExitPositions: Readonly<Record<string, BoundaryExitPosition>>
  simpleRouteJson: ConstructorParameters<typeof FanoutSolver>[0]
  solverOptions: FanoutSolverOptions
}
export function getAm3352SignalBusExitPosition(
  directionCase: Am3352FanoutDirectionCase,
  busName: string,
): BoundaryExitPosition {
  const bus = AM3352_SIGNAL_BUSES.find((b) => b.name === busName)
  if (!bus) throw new Error(`Unknown AM3352BZCZD80 bus ${busName}`)
  // Keep each bus on its physical band; scenarios vary package rotation
  // and external terminal offset, without cycling interfaces across corners.
  const band = bus.baseBand + 1
  const edge = rotateAm3352Edge(bus.exitEdge, directionCase.pcbRotation)
  const positions = {
    top: ["topside_left", "topside_center", "topside_right"],
    right: ["rightside_top", "rightside_center", "rightside_bottom"],
    bottom: ["bottomside_right", "bottomside_center", "bottomside_left"],
    left: ["leftside_bottom", "leftside_center", "leftside_top"],
  } as const
  return positions[edge][band]!
}
const signalBusPositions = (directionCase: Am3352FanoutDirectionCase) =>
  Object.fromEntries(
    AM3352_SIGNAL_BUSES.map((bus) => [
      bus.name,
      getAm3352SignalBusExitPosition(directionCase, bus.name),
    ]),
  )
export function rotateAm3352Edge(
  edge: FanoutEdge,
  rotation: number,
): FanoutEdge {
  const edges = ["top", "left", "bottom", "right"] as const
  return edges[(edges.indexOf(edge) + rotation / 90) % 4]!
}
export function getAm3352TargetPlacement(
  directionCase: Am3352FanoutDirectionCase,
  edge: FanoutEdge,
) {
  const offset = directionCase.bandShift * 0.75
  const base = {
    top: { x: offset, y: 25, rotation: 0 },
    right: { x: 25, y: -offset, rotation: 90 },
    bottom: { x: -offset, y: -25, rotation: 0 },
    left: { x: -25, y: offset, rotation: 90 },
  }[edge]
  const rotation = directionCase.pcbRotation
  const point =
    rotation === 90
      ? { x: -base.y, y: base.x }
      : rotation === 180
        ? { x: -base.x, y: -base.y }
        : rotation === 270
          ? { x: base.y, y: -base.x }
          : base
  return {
    pcbX: point.x,
    pcbY: point.y,
    pcbRotation: (base.rotation + rotation) % 360,
  }
}
const oppositeExit = (position: BoundaryExitPosition): BoundaryExitPosition => {
  const [edge, band] = position.split("side_")
  const opposite = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  }[edge as "top" | "right" | "bottom" | "left"]
  return `${opposite}side_${band}` as BoundaryExitPosition
}
export function Am3352FanoutCircuit({
  exitPosition,
}: {
  exitPosition: BoundaryExitPosition
}) {
  const directionCase = getAm3352FanoutDirectionCase(exitPosition)
  const exits = signalBusPositions(directionCase)
  const targetExits = Object.fromEntries(
    Object.entries(exits).map(([name, exit]) => [name, oppositeExit(exit)]),
  )
  const planeMap = Object.fromEntries(
    AM3352_POWER_PLANES.map((p) => [p.layer, p.netName]),
  )
  return (
    <board
      width="64mm"
      height="64mm"
      layers={10}
      defaultTraceWidth="0.08128mm"
      minTraceWidth="0.08128mm"
      minTraceToPadEdgeClearance="0.05mm"
      minViaEdgeToPadEdgeClearance="0.08128mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
      minViaHoleDiameter="0.1mm"
      minViaPadDiameter="0.24mm"
      pcbStyle={{ viaHoleDiameter: "0.1mm", viaPadDiameter: "0.24mm" }}
      allowBlindAndBuriedVias={false}
      isViaInPadAllowed={false}
      autorouter="default"
    >
      <autoroutingphase
        autorouter={{ algorithmFn: createBoardNoopAlgorithm }}
      />
      {AM3352_POWER_PLANES.map((plane) => (
        <Fragment key={plane.netName}>
          <net name={plane.netName} />
          <copperpour layer={plane.layer} connectsTo={`net.${plane.netName}`} />
        </Fragment>
      ))}
      <breakout
        name="SOC_FANOUT"
        padding={AM3352_BREAKOUT_PADDING}
        autorouter={{
          preset: "fanout",
          implicitBreakoutPointSolverFn: createBusEdgeBreakoutPlacement(exits),
        }}
        fanoutRoutingLayers={[...AM3352_ROUTING_LAYERS]}
        fanoutPourNetMap={planeMap}
        busFanoutDirections={exits}
      >
        <Am3352 pcbRotation={directionCase.pcbRotation} />
        {AM3352_PLANE_DROPS.map((drop) => (
          <Fragment key={drop.traceName}>
            <trace
              name={drop.traceName}
              from={`.U1 > .pin${drop.pinNumber}`}
              to={`net.${drop.netName}`}
            />
          </Fragment>
        ))}
      </breakout>
      {AM3352_TARGET_EDGES.map((edge) => {
        const placement = getAm3352TargetPlacement(directionCase, edge)
        const directions = Object.fromEntries(
          AM3352_SIGNAL_BUSES.filter((b) => b.exitEdge === edge).map((b) => [
            b.name,
            targetExits[b.name]!,
          ]),
        )
        return (
          <Fragment key={edge}>
            <breakout
              name={`TERMINALS_${edge}`}
              pcbX={placement.pcbX}
              pcbY={placement.pcbY}
              padding="1mm"
              routingDisabled
              fanoutRoutingLayers={[...AM3352_ROUTING_LAYERS]}
              busFanoutDirections={directions}
            >
              <Am3352Targets edge={edge} pcbRotation={placement.pcbRotation} />
            </breakout>
          </Fragment>
        )
      })}
      {AM3352_SIGNAL_BUSES.map((bus) => (
        <Fragment key={bus.name}>
          <bus
            name={bus.name}
            connections={[...bus.connections]}
            preferredLayers={[...bus.preferredLayers]}
            maxLengthSkew={bus.maxLengthSkew}
          />
        </Fragment>
      ))}
      {AM3352_DIFFERENTIAL_PAIRS.map((pair) => (
        <Fragment key={pair.name}>
          <differentialpair
            name={pair.name}
            positiveConnection={pair.positiveConnection}
            negativeConnection={pair.negativeConnection}
            maxLengthSkew={pair.lengthTolerance}
          />
        </Fragment>
      ))}
      {AM3352_SIGNAL_CONNECTIONS.map((connection) => (
        <Fragment key={connection.traceName}>
          <trace
            name={connection.traceName}
            from={`.U1 > .pin${connection.pinNumber}`}
            to={`.J_${connection.targetEdge} > .pin${connection.pinNumber}`}
          />
        </Fragment>
      ))}
    </board>
  )
}
export async function createAm3352FanoutSample(
  exitPosition: BoundaryExitPosition,
): Promise<Am3352FanoutSample> {
  const directionCase = getAm3352FanoutDirectionCase(exitPosition)
  const [simpleRouteJson, solverOptions] = await captureCoreFanoutInput(
    <Am3352FanoutCircuit exitPosition={exitPosition} />,
  )
  if (
    simpleRouteJson.connections.length !== AM3352_COMPLETE_CONNECTION_COUNT ||
    simpleRouteJson.obstacles.length !== AM3352_COMPLETE_OBSTACLE_COUNT ||
    solverOptions.buses?.length !== AM3352_COMPLETE_BUS_COUNT
  )
    throw new Error(
      `Incomplete AM3352BZCZD80 capture: ${simpleRouteJson.connections.length} connections, ${simpleRouteJson.obstacles.length} pads, ${solverOptions.buses?.length} buses`,
    )
  return {
    id: directionCase.id,
    name: directionCase.name,
    description: directionCase.description,
    directionCase,
    signalBusExitPositions: signalBusPositions(directionCase),
    simpleRouteJson,
    solverOptions,
  }
}
