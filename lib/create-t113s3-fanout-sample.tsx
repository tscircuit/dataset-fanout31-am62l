import { createT113s3BreakoutPlacement } from "./t113s3-breakout-placement"
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
  T113S3_DIFFERENTIAL_PAIRS,
  T113S3_PLANE_DROPS,
  T113S3_POWER_PLANES,
  T113S3_ROUTING_LAYERS,
  T113S3_SIGNAL_BUSES,
  T113S3_SIGNAL_CONNECTIONS,
} from "./t113s3-buses"
import {
  getT113s3FanoutDirectionCase,
  type T113s3FanoutDirectionCase,
} from "./t113s3-fanout-directions"
import { T113s3 } from "./t113s3-footprint"
import { T113s3Targets, T113S3_TARGET_EDGES } from "./t113s3-targets"

export const T113S3_COMPLETE_CONNECTION_COUNT = 128
export const T113S3_COMPLETE_BUS_COUNT = 60
export const T113S3_COMPLETE_OBSTACLE_COUNT = 235
export const T113S3_SIGNAL_CONNECTION_COUNT = 106
export const T113S3_PLANE_DROP_COUNT = 22
export const T113S3_BREAKOUT_PADDING = 2

type BoundaryExitPosition = Exclude<FanoutExitPosition, "center">
export interface T113s3FanoutSample {
  id: string
  name: string
  description: string
  directionCase: T113s3FanoutDirectionCase
  signalBusExitPositions: Readonly<Record<string, BoundaryExitPosition>>
  simpleRouteJson: ConstructorParameters<typeof FanoutSolver>[0]
  solverOptions: FanoutSolverOptions
}
export function getT113s3SignalBusExitPosition(
  directionCase: T113s3FanoutDirectionCase,
  busName: string,
): BoundaryExitPosition {
  const bus = T113S3_SIGNAL_BUSES.find((b) => b.name === busName)
  if (!bus) throw new Error(`Unknown T113-S3 bus ${busName}`)
  // Stay on the bus's natural edge; vary only its band and package orientation.
  const band =
    Math.max(-1, Math.min(1, bus.baseBand + directionCase.bandShift)) + 1
  const edge = rotateT113s3Edge(bus.exitEdge, directionCase.pcbRotation)
  const positions = {
    top: ["topside_left", "topside_center", "topside_right"],
    right: ["rightside_top", "rightside_center", "rightside_bottom"],
    bottom: ["bottomside_right", "bottomside_center", "bottomside_left"],
    left: ["leftside_bottom", "leftside_center", "leftside_top"],
  } as const
  return positions[edge][band]!
}
const signalBusPositions = (directionCase: T113s3FanoutDirectionCase) =>
  Object.fromEntries(
    T113S3_SIGNAL_BUSES.map((bus) => [
      bus.name,
      getT113s3SignalBusExitPosition(directionCase, bus.name),
    ]),
  )
export function rotateT113s3Edge(
  edge: FanoutEdge,
  rotation: number,
): FanoutEdge {
  const edges = ["top", "left", "bottom", "right"] as const
  return edges[(edges.indexOf(edge) + rotation / 90) % 4]!
}
export function getT113s3TargetPlacement(
  directionCase: T113s3FanoutDirectionCase,
  edge: FanoutEdge,
) {
  const offset = directionCase.bandShift * 0.75
  const base = {
    top: { x: offset, y: 18, rotation: 0 },
    right: { x: 18, y: -offset, rotation: 90 },
    bottom: { x: -offset, y: -18, rotation: 0 },
    left: { x: -18, y: offset, rotation: 90 },
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
export function T113s3FanoutCircuit({
  exitPosition,
}: {
  exitPosition: BoundaryExitPosition
}) {
  const directionCase = getT113s3FanoutDirectionCase(exitPosition)
  const exits = signalBusPositions(directionCase)
  const targetExits = Object.fromEntries(
    Object.entries(exits).map(([name, exit]) => [name, oppositeExit(exit)]),
  )
  const planeMap = Object.fromEntries(
    T113S3_POWER_PLANES.map((p) => [p.layer, p.netName]),
  )
  return (
    <board
      width="48mm"
      height="48mm"
      layers={8}
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
      {T113S3_POWER_PLANES.map((plane) => (
        <Fragment key={plane.netName}>
          <net name={plane.netName} />
          <copperpour layer={plane.layer} connectsTo={`net.${plane.netName}`} />
        </Fragment>
      ))}
      <breakout
        name="SOC_FANOUT"
        padding={T113S3_BREAKOUT_PADDING}
        autorouter={{
          preset: "fanout",
          implicitBreakoutPointSolverFn: createT113s3BreakoutPlacement(exits),
        }}
        fanoutRoutingLayers={[...T113S3_ROUTING_LAYERS]}
        fanoutPourNetMap={planeMap}
        busFanoutDirections={exits}
      >
        <T113s3 pcbRotation={directionCase.pcbRotation} />
        {T113S3_PLANE_DROPS.map((drop) => (
          <Fragment key={drop.traceName}>
            <trace
              name={drop.traceName}
              from={`.U1 > .pin${drop.pinNumber}`}
              to={`net.${drop.netName}`}
            />
          </Fragment>
        ))}
      </breakout>
      {T113S3_TARGET_EDGES.map((edge) => {
        const placement = getT113s3TargetPlacement(directionCase, edge)
        const directions = Object.fromEntries(
          T113S3_SIGNAL_BUSES.filter((b) => b.exitEdge === edge).map((b) => [
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
              fanoutRoutingLayers={[...T113S3_ROUTING_LAYERS]}
              busFanoutDirections={directions}
            >
              <T113s3Targets edge={edge} pcbRotation={placement.pcbRotation} />
            </breakout>
          </Fragment>
        )
      })}
      {T113S3_SIGNAL_BUSES.map((bus) => (
        <Fragment key={bus.name}>
          <bus
            name={bus.name}
            connections={[...bus.connections]}
            preferredLayers={[...bus.preferredLayers]}
            maxLengthSkew={bus.maxLengthSkew}
          />
        </Fragment>
      ))}
      {T113S3_DIFFERENTIAL_PAIRS.map((pair) => (
        <Fragment key={pair.name}>
          <differentialpair
            name={pair.name}
            positiveConnection={pair.positiveConnection}
            negativeConnection={pair.negativeConnection}
            maxLengthSkew={pair.lengthTolerance}
          />
        </Fragment>
      ))}
      {T113S3_SIGNAL_CONNECTIONS.map((connection) => (
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
export async function createT113s3FanoutSample(
  exitPosition: BoundaryExitPosition,
): Promise<T113s3FanoutSample> {
  const directionCase = getT113s3FanoutDirectionCase(exitPosition)
  const [simpleRouteJson, solverOptions] = await captureCoreFanoutInput(
    <T113s3FanoutCircuit exitPosition={exitPosition} />,
  )
  if (
    simpleRouteJson.connections.length !== T113S3_COMPLETE_CONNECTION_COUNT ||
    simpleRouteJson.obstacles.length !== T113S3_COMPLETE_OBSTACLE_COUNT ||
    solverOptions.buses?.length !== T113S3_COMPLETE_BUS_COUNT
  )
    throw new Error(
      `Incomplete T113-S3 capture: ${simpleRouteJson.connections.length} connections, ${simpleRouteJson.obstacles.length} pads, ${solverOptions.buses?.length} buses`,
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
