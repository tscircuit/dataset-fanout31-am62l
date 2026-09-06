import type {
  FanoutExitPosition,
  FanoutSolver,
  FanoutSolverOptions,
} from "@tscircuit/fanout-solver"
import { Fragment } from "react"
import {
  captureCoreFanoutInput,
  createBoardNoopAlgorithm,
} from "./capture-core-fanout"
import { K230 } from "./k230-footprint"
import { K230Lpddr4 } from "./k230-lpddr4-footprint"
import {
  K230_DIFFERENTIAL_PAIRS,
  K230_PLANE_DROPS,
  K230_SIGNAL_BUSES,
  K230_SIGNAL_CONNECTIONS,
  type K230DdrBusName,
} from "./k230-buses"
import {
  getK230FanoutDirectionCase,
  type K230FanoutDirectionCase,
} from "./k230-fanout-directions"

export const K230_SIGNAL_CONNECTION_COUNT = 65
export const K230_PLANE_DROP_COUNT = 106
export const K230_COMPLETE_CONNECTION_COUNT = 171
export const K230_COMPLETE_BUS_COUNT = 123
export const K230_COMPLETE_OBSTACLE_COUNT = 790
type BoundaryExitPosition = Exclude<FanoutExitPosition, "center">
const FANOUT_ROUTING_LAYERS = [
  "top",
  "inner4",
  "inner5",
  "inner6",
  "bottom",
] as const

export interface K230FanoutSample {
  id: string
  name: string
  description: string
  directionCase: K230FanoutDirectionCase
  signalBusExitPositions: Readonly<Record<K230DdrBusName, BoundaryExitPosition>>
  simpleRouteJson: ConstructorParameters<typeof FanoutSolver>[0]
  solverOptions: FanoutSolverOptions
}

export function getK230SignalBusExitPosition(
  directionCase: K230FanoutDirectionCase,
  busName: K230DdrBusName,
): BoundaryExitPosition {
  const bus = K230_SIGNAL_BUSES.find((candidate) => candidate.name === busName)
  if (!bus) throw new Error(`Unknown K230 signal bus ${busName}`)
  const band = Math.max(-1, Math.min(1, bus.baseBand + directionCase.bandShift))
  const positions = {
    top: ["topside_left", "topside_center", "topside_right"],
    right: ["rightside_top", "rightside_center", "rightside_bottom"],
    bottom: ["bottomside_right", "bottomside_center", "bottomside_left"],
    left: ["leftside_bottom", "leftside_center", "leftside_top"],
  } as const
  return positions[directionCase.exitEdge][band + 1]!
}
const signalBusPositions = (directionCase: K230FanoutDirectionCase) =>
  Object.fromEntries(
    K230_SIGNAL_BUSES.map((bus) => [
      bus.name,
      getK230SignalBusExitPosition(directionCase, bus.name),
    ]),
  ) as Record<K230DdrBusName, BoundaryExitPosition>
const oppositeExit = (position: BoundaryExitPosition): BoundaryExitPosition => {
  const [edge, band] = position.split("side_")
  const opposite = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  }[edge as "top" | "bottom" | "left" | "right"]
  if (!opposite || !band) throw new Error(`Unknown exit position ${position}`)
  return `${opposite}side_${band}` as BoundaryExitPosition
}

/** Keep the SoC fixed; move both x16 memories as one pair to each edge/band. */
export function getK230MemoryPlacement(directionCase: K230FanoutDirectionCase) {
  const distance = 26
  const offset = directionCase.bandShift * 6
  switch (directionCase.exitEdge) {
    case "top":
      return { pcbX: offset, pcbY: distance, pcbRotation: 90 }
    case "right":
      return { pcbX: distance, pcbY: -offset, pcbRotation: 0 }
    case "bottom":
      return { pcbX: -offset, pcbY: -distance, pcbRotation: 90 }
    case "left":
      return { pcbX: -distance, pcbY: offset, pcbRotation: 0 }
  }
}
export function getK230MemoryPlacements(
  directionCase: K230FanoutDirectionCase,
) {
  const center = getK230MemoryPlacement(directionCase)
  const horizontal =
    directionCase.exitEdge === "top" || directionCase.exitEdge === "bottom"
  return (["A", "B"] as const).map((channel, index) => ({
    channel,
    name: channel === "A" ? ("U2" as const) : ("U3" as const),
    pcbX: center.pcbX + (horizontal ? (index * 2 - 1) * 12 : 0),
    pcbY: center.pcbY + (horizontal ? 0 : (index * 2 - 1) * 12),
    pcbRotation: center.pcbRotation,
  }))
}

export function K230FanoutCircuit({
  exitPosition,
}: {
  exitPosition: BoundaryExitPosition
}) {
  const directionCase = getK230FanoutDirectionCase(exitPosition)
  const exits = signalBusPositions(directionCase)
  const memoryExits = Object.fromEntries(
    Object.entries(exits).map(([name, exit]) => [name, oppositeExit(exit)]),
  )
  return (
    <board
      width="72mm"
      height="72mm"
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
      <net name="GND" />
      <net name="VDD_LPDDR4" />
      <autoroutingphase
        autorouter={{ algorithmFn: createBoardNoopAlgorithm }}
      />
      <copperpour layer="inner1" connectsTo="net.GND" />
      <copperpour layer="inner2" connectsTo="net.VDD_LPDDR4" />
      <breakout
        name="SOC_FANOUT"
        padding="8mm"
        autorouter="fanout"
        fanoutRoutingLayers={[...FANOUT_ROUTING_LAYERS]}
        busFanoutDirections={exits}
      >
        <K230 />
        {K230_PLANE_DROPS.map((drop) => (
          <Fragment key={drop.traceName}>
            <trace
              name={drop.traceName}
              from={`.U1 > .pin${drop.pinNumber}`}
              to={`net.${drop.netName}`}
            />
          </Fragment>
        ))}
      </breakout>
      {getK230MemoryPlacements(directionCase).map((memory) => (
        <breakout
          key={memory.name}
          name={`DRAM_${memory.channel}_FANOUT`}
          pcbX={memory.pcbX}
          pcbY={memory.pcbY}
          padding="3.5mm"
          routingDisabled
          fanoutRoutingLayers={[...FANOUT_ROUTING_LAYERS]}
          busFanoutDirections={memoryExits}
        >
          <K230Lpddr4
            name={memory.name}
            pcbX={0}
            pcbY={0}
            pcbRotation={memory.pcbRotation}
          />
        </breakout>
      ))}
      {K230_SIGNAL_BUSES.map((bus) => (
        <Fragment key={bus.name}>
          <bus
            name={bus.name}
            connections={[...bus.connections]}
            preferredLayers={[...bus.preferredLayers]}
            maxLengthSkew={bus.maxLengthSkew}
          />
        </Fragment>
      ))}
      {K230_DIFFERENTIAL_PAIRS.map((pair) => (
        <Fragment key={pair.name}>
          <differentialpair
            name={pair.name}
            positiveConnection={pair.positiveConnection}
            negativeConnection={pair.negativeConnection}
            maxLengthSkew={pair.lengthTolerance}
          />
        </Fragment>
      ))}
      {K230_SIGNAL_CONNECTIONS.map((connection) => (
        <Fragment key={connection.traceName}>
          <trace
            name={connection.traceName}
            path={[
              `.U1 > .pin${connection.socPinNumber}`,
              ...connection.memoryEndpoints.map(
                (memory) =>
                  `.${memory.componentName} > .pin${memory.pinNumber}`,
              ),
            ]}
          />
        </Fragment>
      ))}
    </board>
  )
}

export async function createK230FanoutSample(
  exitPosition: BoundaryExitPosition,
): Promise<K230FanoutSample> {
  const directionCase = getK230FanoutDirectionCase(exitPosition)
  const [simpleRouteJson, solverOptions] = await captureCoreFanoutInput(
    <K230FanoutCircuit exitPosition={exitPosition} />,
  )
  if (
    simpleRouteJson.connections.length !== K230_COMPLETE_CONNECTION_COUNT ||
    simpleRouteJson.obstacles.length !== K230_COMPLETE_OBSTACLE_COUNT ||
    solverOptions.buses?.length !== K230_COMPLETE_BUS_COUNT
  ) {
    throw new Error(
      `Incomplete K230 capture: ${simpleRouteJson.connections.length} connections, ${simpleRouteJson.obstacles.length} pads, ${solverOptions.buses?.length} buses`,
    )
  }
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
