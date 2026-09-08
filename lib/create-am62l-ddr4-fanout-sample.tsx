import type {
  FanoutSolver,
  FanoutSolverOptions,
} from "@tscircuit/fanout-solver"
import { Fragment } from "react"
import { Am62l, getAm62lPinNumber } from "./am62l-footprint"
import {
  AM62L_DDR4_MEMORY_BUSES,
  AM62L_DDR4_PROCESSOR_BUSES,
  type Am62lDdr4Bus,
} from "./am62l-ddr4-buses"
import {
  AM62L_DDR4_CONNECTION_COUNT,
  AM62L_DDR4_CONNECTIONS,
} from "./am62l-ddr4-connections"
import {
  captureCoreFanoutInput,
  createBoardNoopAlgorithm,
} from "./capture-core-fanout"
import { Ddr4, getDdr4PinNumber } from "./ddr4-footprint"
import type { Am62lFanoutDirectionCase } from "./fanout-directions"

export type Am62lDdr4FanoutSide = "processor" | "memory"

const FANOUT_ROUTING_LAYERS = [
  "top",
  "inner3",
  "inner4",
  "inner5",
  "inner6",
  "inner7",
  "inner8",
  "bottom",
] as const

const PACKAGE_OBSTACLE_COUNT = 373 + 96
const BUS_COUNT = AM62L_DDR4_PROCESSOR_BUSES.length

export interface Am62lDdr4FanoutSample {
  id: string
  name: string
  description: string
  directionCase: Am62lFanoutDirectionCase
  signalBusExitPositions: Readonly<Record<string, string>>
  simpleRouteJson: ConstructorParameters<typeof FanoutSolver>[0]
  solverOptions: FanoutSolverOptions
}

const directionCaseBySide = {
  processor: {
    id: "73-am62l-ddr4-processor",
    name: "AM62L DDR4 processor fanout",
    description:
      "Isolates the 49-signal AM62L DDR4 escape while retaining the DDR4 package as an obstacle.",
    exitPosition: "leftside_center",
    exitEdge: "left",
    majorityDirection: "left",
    bandShift: 0,
  },
  memory: {
    id: "74-am62l-ddr4-memory",
    name: "AM62L DDR4 memory fanout",
    description:
      "Isolates the same 49 signals at the x16 DDR4 package while retaining the AM62L package as an obstacle.",
    exitPosition: "rightside_center",
    exitEdge: "right",
    majorityDirection: "right",
    bandShift: 0,
  },
} as const satisfies Record<Am62lDdr4FanoutSide, Am62lFanoutDirectionCase>

const getBuses = (side: Am62lDdr4FanoutSide): readonly Am62lDdr4Bus[] =>
  side === "processor" ? AM62L_DDR4_PROCESSOR_BUSES : AM62L_DDR4_MEMORY_BUSES

const getOppositeExits = (buses: readonly Am62lDdr4Bus[]) =>
  Object.fromEntries(
    buses.map((bus) => [
      bus.name,
      bus.exitPosition.startsWith("leftside_")
        ? bus.exitPosition.replace("leftside_", "rightside_")
        : bus.exitPosition.replace("rightside_", "leftside_"),
    ]),
  ) as Record<string, Am62lDdr4Bus["exitPosition"]>

const DIFFERENTIAL_PAIRS = [
  ["DDR_CK_PAIR", "DDR_CK_P", "DDR_CK_N"],
  ["DDR_DQS0_PAIR", "DDR_DQS0_P", "DDR_DQS0_N"],
  ["DDR_DQS1_PAIR", "DDR_DQS1_P", "DDR_DQS1_N"],
] as const

export function Am62lDdr4FanoutCircuit({
  side,
}: {
  side: Am62lDdr4FanoutSide
}) {
  const buses = getBuses(side)
  const exits = Object.fromEntries(
    buses.map((bus) => [bus.name, bus.exitPosition]),
  ) as Record<string, Am62lDdr4Bus["exitPosition"]>
  const targetExits = getOppositeExits(buses)
  const processor = (
    <Am62l
      name="U_SOC"
      manufacturerPartNumber="AM62L32BEGHAANBR"
      pcbX={0}
      pcbY={0}
    />
  )
  const memory = <Ddr4 name="U_DDR" pcbX={0} pcbY={0} pcbRotation={180} />

  return (
    <board
      name={`AM62L_DDR4_${side.toUpperCase()}_FANOUT`}
      width="48mm"
      height="36mm"
      layers={10}
      autorouter="default"
      defaultTraceWidth="0.08mm"
      minTraceWidth="0.08mm"
      minTraceToPadEdgeClearance="0.08mm"
      minViaEdgeToPadEdgeClearance="0.08mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.254mm"
      minViaHoleDiameter="0.15mm"
      minViaPadDiameter="0.25mm"
      pcbStyle={{ viaHoleDiameter: "0.15mm", viaPadDiameter: "0.25mm" }}
      allowBlindAndBuriedVias={false}
      isViaInPadAllowed={false}
    >
      <autoroutingphase
        autorouter={{ algorithmFn: createBoardNoopAlgorithm }}
      />
      {side === "processor" ? (
        <>
          <breakout
            name="SOC_FANOUT"
            pcbX={10}
            padding="5mm"
            paddingTop="8mm"
            paddingBottom="8mm"
            autorouter="fanout"
            fanoutRoutingLayers={[...FANOUT_ROUTING_LAYERS]}
            busFanoutDirections={exits}
          >
            {processor}
          </breakout>
          <breakout
            name="DDR_TARGET"
            pcbX={-10}
            pcbY={2.4}
            padding="5mm"
            paddingTop="8mm"
            paddingBottom="8mm"
            routingDisabled
            fanoutRoutingLayers={[...FANOUT_ROUTING_LAYERS]}
            busFanoutDirections={targetExits}
          >
            {memory}
          </breakout>
        </>
      ) : (
        <>
          <breakout
            name="DDR_FANOUT"
            pcbX={-10}
            pcbY={2.4}
            padding="5mm"
            paddingTop="8mm"
            paddingBottom="8mm"
            autorouter="fanout"
            fanoutRoutingLayers={[...FANOUT_ROUTING_LAYERS]}
            busFanoutDirections={exits}
          >
            {memory}
          </breakout>
          <breakout
            name="SOC_TARGET"
            pcbX={10}
            padding="5mm"
            paddingTop="8mm"
            paddingBottom="8mm"
            routingDisabled
            fanoutRoutingLayers={[...FANOUT_ROUTING_LAYERS]}
            busFanoutDirections={targetExits}
          >
            {processor}
          </breakout>
        </>
      )}
      {buses.map((bus) => (
        <Fragment key={bus.name}>
          <bus
            name={bus.name}
            connections={[...bus.connections]}
            pcbAllowedLayers={[...bus.allowedLayers]}
            preferredLayers={[...bus.preferredLayers]}
            pcbTraceWidth="0.08mm"
            maxLengthSkew={bus.maxLengthSkew}
          />
        </Fragment>
      ))}
      {DIFFERENTIAL_PAIRS.map(
        ([name, positiveConnection, negativeConnection]) => (
          <Fragment key={name}>
            <differentialpair
              name={name}
              positiveConnection={positiveConnection}
              negativeConnection={negativeConnection}
              maxLengthSkew="0.05mm"
              pcbTraceGap="0.1mm"
            />
          </Fragment>
        ),
      )}
      {AM62L_DDR4_CONNECTIONS.map((connection) => (
        <Fragment key={connection.name}>
          <trace
            name={connection.name}
            from={`.U_SOC > .pin${getAm62lPinNumber(connection.socBall)}`}
            to={`.U_DDR > .pin${getDdr4PinNumber(connection.memoryBall)}`}
          />
        </Fragment>
      ))}
    </board>
  )
}

export async function createAm62lDdr4FanoutSample(
  side: Am62lDdr4FanoutSide,
): Promise<Am62lDdr4FanoutSample> {
  const [simpleRouteJson, solverOptions] = await captureCoreFanoutInput(
    <Am62lDdr4FanoutCircuit side={side} />,
  )
  if (
    simpleRouteJson.connections.length !== AM62L_DDR4_CONNECTION_COUNT ||
    simpleRouteJson.obstacles.length !== PACKAGE_OBSTACLE_COUNT ||
    solverOptions.buses?.length !== BUS_COUNT ||
    (simpleRouteJson.traces?.length ?? 0) !== 0
  ) {
    throw new Error(
      `Incomplete AM62L DDR4 ${side} capture: ${simpleRouteJson.connections.length} connections, ${simpleRouteJson.obstacles.length} pads, ${solverOptions.buses?.length} buses, ${simpleRouteJson.traces?.length ?? 0} prior traces`,
    )
  }
  const directionCase = directionCaseBySide[side]
  return {
    id: directionCase.id,
    name: directionCase.name,
    description: directionCase.description,
    directionCase,
    signalBusExitPositions: Object.fromEntries(
      getBuses(side).map((bus) => [bus.name, bus.exitPosition]),
    ),
    simpleRouteJson,
    solverOptions,
  }
}
