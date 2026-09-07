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
  IMX6ULL_DIFFERENTIAL_PAIRS,
  IMX6ULL_PLANE_DROPS,
  IMX6ULL_SIGNAL_BUSES,
  IMX6ULL_SIGNAL_CONNECTIONS,
  type Imx6ullDdrBusName,
} from "./imx6ull-buses"
import {
  getImx6ullFanoutDirectionCase,
  type Imx6ullFanoutDirectionCase,
} from "./imx6ull-fanout-directions"
import { Imx6ull } from "./imx6ull-footprint"

export const IMX6ULL_COMPLETE_CONNECTION_COUNT = 102
export const IMX6ULL_COMPLETE_BUS_COUNT = 62
export const IMX6ULL_COMPLETE_OBSTACLE_COUNT = 385
export const IMX6ULL_SIGNAL_CONNECTION_COUNT = 49
export const IMX6ULL_PLANE_DROP_COUNT = 53

type BoundaryExitPosition = Exclude<FanoutExitPosition, "center">
const FANOUT_ROUTING_LAYERS = [
  "top",
  "inner4",
  "inner5",
  "inner6",
  "bottom",
] as const

export interface Imx6ullFanoutSample {
  id: string
  name: string
  description: string
  directionCase: Imx6ullFanoutDirectionCase
  signalBusExitPositions: Readonly<
    Record<Imx6ullDdrBusName, BoundaryExitPosition>
  >
  simpleRouteJson: ConstructorParameters<typeof FanoutSolver>[0]
  solverOptions: FanoutSolverOptions
}

export function getImx6ullSignalBusExitPosition(
  directionCase: Imx6ullFanoutDirectionCase,
  busName: Imx6ullDdrBusName,
): BoundaryExitPosition {
  const bus = IMX6ULL_SIGNAL_BUSES.find(
    (candidate) => candidate.name === busName,
  )
  if (!bus) throw new Error(`Unknown IMX6ULL signal bus ${busName}`)
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

const signalBusPositions = (directionCase: Imx6ullFanoutDirectionCase) =>
  Object.fromEntries(
    IMX6ULL_SIGNAL_BUSES.map((bus) => [
      bus.name,
      getImx6ullSignalBusExitPosition(directionCase, bus.name),
    ]),
  ) as Record<Imx6ullDdrBusName, BoundaryExitPosition>

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
export function getImx6ullMemoryPlacement(
  directionCase: Imx6ullFanoutDirectionCase,
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

export function Imx6ullFanoutCircuit({
  exitPosition,
}: {
  exitPosition: BoundaryExitPosition
}) {
  const directionCase = getImx6ullFanoutDirectionCase(exitPosition)
  const exits = signalBusPositions(directionCase)
  const memoryExits = Object.fromEntries(
    Object.entries(exits).map(([name, position]) => [
      name,
      oppositeExit(position),
    ]),
  )
  const memoryPlacement = getImx6ullMemoryPlacement(directionCase)
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
        <Imx6ull />
        {IMX6ULL_PLANE_DROPS.map((drop) => (
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
      {IMX6ULL_SIGNAL_BUSES.map((bus) => (
        <Fragment key={bus.name}>
          <bus
            name={bus.name}
            connections={[...bus.connections]}
            preferredLayers={[...bus.preferredLayers]}
            maxLengthSkew={bus.maxLengthSkew}
          />
        </Fragment>
      ))}
      {IMX6ULL_DIFFERENTIAL_PAIRS.map((pair) => (
        <Fragment key={pair.name}>
          <differentialpair
            name={pair.name}
            positiveConnection={pair.positiveConnection}
            negativeConnection={pair.negativeConnection}
            maxLengthSkew={pair.lengthTolerance}
          />
        </Fragment>
      ))}
      {IMX6ULL_SIGNAL_CONNECTIONS.map((connection) => (
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
        text={`IMX6ULL to DDR3L · ${directionCase.name}`}
      />
    </board>
  )
}

export async function createImx6ullFanoutSample(
  exitPosition: BoundaryExitPosition,
): Promise<Imx6ullFanoutSample> {
  const directionCase = getImx6ullFanoutDirectionCase(exitPosition)
  const [simpleRouteJson, solverOptions] = await captureCoreFanoutInput(
    <Imx6ullFanoutCircuit exitPosition={exitPosition} />,
  )
  if (
    simpleRouteJson.connections.length !== IMX6ULL_COMPLETE_CONNECTION_COUNT ||
    simpleRouteJson.obstacles.length !== IMX6ULL_COMPLETE_OBSTACLE_COUNT ||
    solverOptions.buses?.length !== IMX6ULL_COMPLETE_BUS_COUNT
  ) {
    throw new Error(
      `Incomplete IMX6ULL capture: ${simpleRouteJson.connections.length} connections, ${simpleRouteJson.obstacles.length} pads, ${solverOptions.buses?.length} buses`,
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
