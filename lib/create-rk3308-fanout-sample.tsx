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
import { Ddr3l } from "./ddr3l-footprint"
import {
  RK3308_DIFFERENTIAL_PAIRS,
  RK3308_PLANE_DROPS,
  RK3308_SIGNAL_BUSES,
  RK3308_SIGNAL_CONNECTIONS,
  type Rk3308DdrBusName,
} from "./rk3308-buses"
import {
  getRk3308FanoutDirectionCase,
  type Rk3308FanoutDirectionCase,
} from "./rk3308-fanout-directions"
import { Rk3308 } from "./rk3308-footprint"

export const RK3308_COMPLETE_CONNECTION_COUNT = 162
export const RK3308_COMPLETE_BUS_COUNT = 122
export const RK3308_COMPLETE_OBSTACLE_COUNT = 451
export const RK3308_SIGNAL_CONNECTION_COUNT = 49
export const RK3308_PLANE_DROP_COUNT = 113

type BoundaryExitPosition = Exclude<FanoutExitPosition, "center">
const FANOUT_ROUTING_LAYERS = [
  "top",
  "inner4",
  "inner5",
  "inner6",
  "bottom",
] as const

export interface Rk3308FanoutSample {
  id: string
  name: string
  description: string
  directionCase: Rk3308FanoutDirectionCase
  signalBusExitPositions: Readonly<
    Record<Rk3308DdrBusName, BoundaryExitPosition>
  >
  simpleRouteJson: ConstructorParameters<typeof FanoutSolver>[0]
  solverOptions: FanoutSolverOptions
}

export function getRk3308SignalBusExitPosition(
  directionCase: Rk3308FanoutDirectionCase,
  busName: Rk3308DdrBusName,
): BoundaryExitPosition {
  const bus = RK3308_SIGNAL_BUSES.find(
    (candidate) => candidate.name === busName,
  )
  if (!bus) throw new Error(`Unknown RK3308 signal bus ${busName}`)
  // Keep the 24-wire address/control bus centered: packing it into a corner
  // with a data byte exceeds that band's via-safe capacity. RAM still moves
  // to every physical offset, and the narrower buses follow that offset.
  const band =
    busName === "DDR_ADDR_CTRL"
      ? 0
      : Math.max(-1, Math.min(1, bus.baseBand + directionCase.bandShift))
  const positions = {
    top: ["topside_left", "topside_center", "topside_right"],
    right: ["rightside_top", "rightside_center", "rightside_bottom"],
    bottom: ["bottomside_right", "bottomside_center", "bottomside_left"],
    left: ["leftside_bottom", "leftside_center", "leftside_top"],
  } as const
  return positions[directionCase.exitEdge][band + 1]!
}

const signalBusPositions = (directionCase: Rk3308FanoutDirectionCase) =>
  Object.fromEntries(
    RK3308_SIGNAL_BUSES.map((bus) => [
      bus.name,
      getRk3308SignalBusExitPosition(directionCase, bus.name),
    ]),
  ) as Record<Rk3308DdrBusName, BoundaryExitPosition>

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

/** The SoC stays fixed; RAM physically moves to each requested edge and band. */
export function getRk3308MemoryPlacement(
  directionCase: Rk3308FanoutDirectionCase,
) {
  const distance = 18
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

export function Rk3308FanoutCircuit({
  exitPosition,
}: {
  exitPosition: BoundaryExitPosition
}) {
  const directionCase = getRk3308FanoutDirectionCase(exitPosition)
  const exits = signalBusPositions(directionCase)
  const memoryExits = Object.fromEntries(
    Object.entries(exits).map(([name, position]) => [
      name,
      oppositeExit(position),
    ]),
  )
  const memoryPlacement = getRk3308MemoryPlacement(directionCase)
  return (
    <board
      width="52mm"
      height="52mm"
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
      <net name="VDD_DDR3L" />
      <autoroutingphase
        autorouter={{ algorithmFn: createBoardNoopAlgorithm }}
      />
      <copperpour layer="inner1" connectsTo="net.GND" />
      <copperpour layer="inner2" connectsTo="net.VDD_DDR3L" />
      <breakout
        name="SOC_FANOUT"
        padding="3.5mm"
        autorouter="fanout"
        fanoutRoutingLayers={[...FANOUT_ROUTING_LAYERS]}
        busFanoutDirections={exits}
      >
        <Rk3308 />
        {RK3308_PLANE_DROPS.map((drop) => (
          <Fragment key={drop.traceName}>
            <trace
              name={drop.traceName}
              from={`.U1 > .pin${drop.pinNumber}`}
              to={`net.${drop.netName}`}
            />
          </Fragment>
        ))}
      </breakout>
      <breakout
        name="DRAM_FANOUT"
        pcbX={memoryPlacement.pcbX}
        pcbY={memoryPlacement.pcbY}
        padding="3.5mm"
        routingDisabled
        fanoutRoutingLayers={[...FANOUT_ROUTING_LAYERS]}
        busFanoutDirections={memoryExits}
      >
        <Ddr3l pcbX={0} pcbY={0} pcbRotation={memoryPlacement.pcbRotation} />
      </breakout>
      {RK3308_SIGNAL_BUSES.map((bus) => (
        <Fragment key={bus.name}>
          <bus
            name={bus.name}
            connections={[...bus.connections]}
            preferredLayers={[...bus.preferredLayers]}
            maxLengthSkew={bus.maxLengthSkew}
          />
        </Fragment>
      ))}
      {RK3308_DIFFERENTIAL_PAIRS.map((pair) => (
        <Fragment key={pair.name}>
          <differentialpair
            name={pair.name}
            positiveConnection={pair.positiveConnection}
            negativeConnection={pair.negativeConnection}
            maxLengthSkew={pair.lengthTolerance}
          />
        </Fragment>
      ))}
      {RK3308_SIGNAL_CONNECTIONS.map((connection) => (
        <Fragment key={connection.traceName}>
          <trace
            name={connection.traceName}
            from={`.U1 > .pin${connection.socPinNumber}`}
            to={`.U2 > .pin${connection.memoryPinNumber}`}
          />
        </Fragment>
      ))}
      <pcbnotetext
        pcbX={0}
        pcbY={-11.5}
        fontSize={0.7}
        text={`RK3308 to DDR3L · ${directionCase.name}`}
      />
    </board>
  )
}

export async function createRk3308FanoutSample(
  exitPosition: BoundaryExitPosition,
): Promise<Rk3308FanoutSample> {
  const directionCase = getRk3308FanoutDirectionCase(exitPosition)
  const [simpleRouteJson, solverOptions] = await captureCoreFanoutInput(
    <Rk3308FanoutCircuit exitPosition={exitPosition} />,
  )
  if (
    simpleRouteJson.connections.length !== RK3308_COMPLETE_CONNECTION_COUNT ||
    simpleRouteJson.obstacles.length !== RK3308_COMPLETE_OBSTACLE_COUNT ||
    solverOptions.buses?.length !== RK3308_COMPLETE_BUS_COUNT
  ) {
    throw new Error(
      `Incomplete RK3308 capture: ${simpleRouteJson.connections.length} connections, ${simpleRouteJson.obstacles.length} pads, ${solverOptions.buses?.length} buses`,
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
