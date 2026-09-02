import {
  type AutorouterCompleteEvent,
  type AutorouterErrorEvent,
  type AutorouterProgressEvent,
  type GenericLocalAutorouter,
  RootCircuit,
  type SimpleRouteJson,
  type SimplifiedPcbTrace,
  type SolverStartedEvent,
} from "@tscircuit/core"
import type {
  FanoutExitPosition,
  FanoutSolver,
  FanoutSolverOptions,
} from "@tscircuit/fanout-solver"
import { Fragment } from "react"
import {
  AM62L_DIFFERENTIAL_PAIRS,
  AM62L_PLANE_DROPS,
  AM62L_SIGNAL_BUSES,
  AM62L_SIGNAL_CONNECTIONS,
  type BusBand,
  type DdrBusName,
} from "./am62l-buses"
import { Am62l } from "./am62l-footprint"
import {
  getFanoutDirectionCase,
  type Am62lFanoutDirectionCase,
} from "./fanout-directions"
import { Lpddr4 } from "./lpddr4-footprint"

export const COMPLETE_CONNECTION_COUNT = 135
export const COMPLETE_BUS_COUNT = 111
export const COMPLETE_OBSTACLE_COUNT = 573
export const SIGNAL_CONNECTION_COUNT = 33
export const PLANE_DROP_COUNT = 102

const FANOUT_ROUTING_LAYERS = [
  "top",
  "inner4",
  "inner5",
  "inner6",
  "bottom",
] as const
const LPDDR4_DISTANCE_FROM_CENTER = 17
const CAPTURE_COMPLETE_ERROR = "AM62L_FANOUT_DATASET_CAPTURE_COMPLETE"

let captureConsoleErrorDepth = 0
let originalConsoleError: typeof console.error | undefined
const filteredCaptureConsoleError = (
  ...args: Parameters<typeof console.error>
) => {
  if (
    args.some((argument) => String(argument).includes(CAPTURE_COMPLETE_ERROR))
  )
    return
  originalConsoleError?.(...args)
}

const withoutCaptureConsoleError = async <Result,>(
  operation: () => Promise<Result>,
): Promise<Result> => {
  if (captureConsoleErrorDepth === 0) {
    originalConsoleError = console.error
    console.error = filteredCaptureConsoleError
  }
  captureConsoleErrorDepth += 1
  try {
    return await operation()
  } finally {
    captureConsoleErrorDepth -= 1
    if (captureConsoleErrorDepth === 0) {
      if (
        console.error === filteredCaptureConsoleError &&
        originalConsoleError
      ) {
        console.error = originalConsoleError
      }
      originalConsoleError = undefined
    }
  }
}

type BoundaryExitPosition = Exclude<FanoutExitPosition, "center">
type FanoutSimpleRouteJson = ConstructorParameters<typeof FanoutSolver>[0]

export interface Am62lFanoutSample {
  id: string
  name: string
  description: string
  directionCase: Am62lFanoutDirectionCase
  signalBusExitPositions: Readonly<Record<DdrBusName, BoundaryExitPosition>>
  simpleRouteJson: FanoutSimpleRouteJson
  solverOptions: FanoutSolverOptions
}

const clampBand = (band: number): BusBand =>
  Math.max(-1, Math.min(1, band)) as BusBand

export function getSignalBusExitPosition(
  directionCase: Am62lFanoutDirectionCase,
  busName: DdrBusName,
): BoundaryExitPosition {
  const bus = AM62L_SIGNAL_BUSES.find((candidate) => candidate.name === busName)
  if (!bus) throw new Error(`Unknown AM62L signal bus ${busName}`)
  const band = clampBand(bus.baseBand + directionCase.bandShift)

  const positionsByEdge = {
    top: ["topside_left", "topside_center", "topside_right"],
    right: ["rightside_top", "rightside_center", "rightside_bottom"],
    bottom: ["bottomside_right", "bottomside_center", "bottomside_left"],
    left: ["leftside_bottom", "leftside_center", "leftside_top"],
  } as const

  return positionsByEdge[directionCase.exitEdge][band + 1]!
}

const getSignalBusExitPositions = (
  directionCase: Am62lFanoutDirectionCase,
): Record<DdrBusName, BoundaryExitPosition> =>
  Object.fromEntries(
    AM62L_SIGNAL_BUSES.map((bus) => [
      bus.name,
      getSignalBusExitPosition(directionCase, bus.name),
    ]),
  ) as Record<DdrBusName, BoundaryExitPosition>

const getOppositeExitPosition = (
  exitPosition: BoundaryExitPosition,
): BoundaryExitPosition => {
  const [edge, band] = exitPosition.split("side_")
  if (!edge || !band) {
    throw new Error(`Cannot mirror fanout exit position ${exitPosition}`)
  }
  const oppositeEdge = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  }[edge as "top" | "right" | "bottom" | "left"]
  if (!oppositeEdge) {
    throw new Error(`Cannot mirror fanout exit position ${exitPosition}`)
  }
  return `${oppositeEdge}side_${band}` as BoundaryExitPosition
}

const getLpddr4Placement = (
  directionCase: Am62lFanoutDirectionCase,
): { pcbX: number; pcbY: number; pcbRotation: number } => {
  switch (directionCase.exitEdge) {
    case "top":
      return {
        pcbX: 0,
        pcbY: LPDDR4_DISTANCE_FROM_CENTER,
        pcbRotation: 90,
      }
    case "right":
      return {
        pcbX: LPDDR4_DISTANCE_FROM_CENTER,
        pcbY: 0,
        pcbRotation: 0,
      }
    case "bottom":
      return {
        pcbX: 0,
        pcbY: -LPDDR4_DISTANCE_FROM_CENTER,
        pcbRotation: 90,
      }
    case "left":
      return {
        pcbX: -LPDDR4_DISTANCE_FROM_CENTER,
        pcbY: 0,
        pcbRotation: 0,
      }
  }
}

function createImmediateAutorouter(
  input: SimpleRouteJson,
): GenericLocalAutorouter {
  const eventHandlers = {
    complete: [] as Array<(event: AutorouterCompleteEvent) => void>,
    error: [] as Array<(event: AutorouterErrorEvent) => void>,
    progress: [] as Array<(event: AutorouterProgressEvent) => void>,
  }

  return {
    input,
    isRouting: false,
    start() {
      if (this.isRouting) return
      this.isRouting = true
      queueMicrotask(() => {
        this.isRouting = false
        for (const handler of eventHandlers.complete) {
          handler({ type: "complete", traces: [] })
        }
      })
    },
    stop() {
      this.isRouting = false
    },
    on(event, callback) {
      eventHandlers[event].push(callback as never)
    },
    solveSync(): SimplifiedPcbTrace[] {
      return []
    },
  }
}

const createBoardNoopAlgorithm = async (
  input: SimpleRouteJson,
): Promise<GenericLocalAutorouter> => createImmediateAutorouter(input)

export function Am62lFanoutCircuit({
  exitPosition,
}: {
  exitPosition: BoundaryExitPosition
}) {
  const directionCase = getFanoutDirectionCase(exitPosition)
  const signalBusExitPositions = getSignalBusExitPositions(directionCase)
  const dramBusExitPositions = Object.fromEntries(
    Object.entries(signalBusExitPositions).map(([busName, busExitPosition]) => [
      busName,
      getOppositeExitPosition(busExitPosition),
    ]),
  ) as Record<DdrBusName, BoundaryExitPosition>
  const lpddr4Placement = getLpddr4Placement(directionCase)

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
      <net name="VDD_LPDDR4" />
      <autoroutingphase
        autorouter={{ algorithmFn: createBoardNoopAlgorithm }}
      />
      <copperpour layer="inner1" connectsTo="net.GND" />
      <copperpour layer="inner2" connectsTo="net.VDD_LPDDR4" />

      <breakout
        name="SOC_FANOUT"
        padding="3mm"
        autorouter="fanout"
        fanoutRoutingLayers={[...FANOUT_ROUTING_LAYERS]}
        busFanoutDirections={signalBusExitPositions}
      >
        <Am62l />
        {AM62L_PLANE_DROPS.map((drop) => (
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
        pcbX={lpddr4Placement.pcbX}
        pcbY={lpddr4Placement.pcbY}
        padding="3mm"
        routingDisabled
        fanoutRoutingLayers={[...FANOUT_ROUTING_LAYERS]}
        busFanoutDirections={dramBusExitPositions}
      >
        <Lpddr4 pcbX={0} pcbY={0} pcbRotation={lpddr4Placement.pcbRotation} />
      </breakout>

      {AM62L_SIGNAL_BUSES.map((bus) => (
        <Fragment key={bus.name}>
          <bus
            name={bus.name}
            connections={[...bus.connections]}
            preferredLayers={[...bus.preferredLayers]}
            maxLengthSkew={
              "maxLengthSkew" in bus ? bus.maxLengthSkew : undefined
            }
          />
        </Fragment>
      ))}
      {AM62L_DIFFERENTIAL_PAIRS.map((pair) => (
        <Fragment key={pair.name}>
          <differentialpair
            name={pair.name}
            positiveConnection={pair.positiveConnection}
            negativeConnection={pair.negativeConnection}
            maxLengthSkew={pair.lengthTolerance}
          />
        </Fragment>
      ))}
      {AM62L_SIGNAL_CONNECTIONS.map((connection) => (
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
        text={`AM62L · ${directionCase.name} · core winding-generated exits`}
      />
    </board>
  )
}

export async function createAm62lFanoutSample(
  exitPosition: BoundaryExitPosition,
): Promise<Am62lFanoutSample> {
  const directionCase = getFanoutDirectionCase(exitPosition)
  const signalBusExitPositions = getSignalBusExitPositions(directionCase)
  let capturedConstructorArgs:
    | readonly [FanoutSimpleRouteJson, FanoutSolverOptions]
    | undefined
  const circuit = new RootCircuit()
  circuit.on("solver:started", (event: SolverStartedEvent) => {
    if (event.solverName !== "FanoutSolver" || capturedConstructorArgs) return
    capturedConstructorArgs = structuredClone(
      event.solverConstructorArgs,
    ) as unknown as readonly [FanoutSimpleRouteJson, FanoutSolverOptions]

    // Core emits this event after its winding stage and immediately before
    // FanoutSolver.solve(). Stop that first solve; GenericSolverDebugger owns
    // the solver instance that users step through.
    throw new Error(CAPTURE_COMPLETE_ERROR)
  })
  circuit.add(<Am62lFanoutCircuit exitPosition={exitPosition} />)
  await withoutCaptureConsoleError(() => circuit.renderUntilSettled())

  if (!capturedConstructorArgs) {
    throw new Error("Core did not emit the SOC_FANOUT solver input")
  }

  const [simpleRouteJson, solverOptions] = capturedConstructorArgs
  const buses = solverOptions.buses ?? []

  if (simpleRouteJson.connections.length !== COMPLETE_CONNECTION_COUNT) {
    throw new Error(
      `Expected ${COMPLETE_CONNECTION_COUNT} connections, got ${simpleRouteJson.connections.length}`,
    )
  }
  if (simpleRouteJson.obstacles.length !== COMPLETE_OBSTACLE_COUNT) {
    throw new Error(
      `Expected ${COMPLETE_OBSTACLE_COUNT} AM62L and LPDDR4 pad obstacles, got ${simpleRouteJson.obstacles.length}`,
    )
  }
  if (buses.length !== COMPLETE_BUS_COUNT) {
    throw new Error(`Expected ${COMPLETE_BUS_COUNT} buses, got ${buses.length}`)
  }

  return {
    id: directionCase.id,
    name: directionCase.name,
    description: directionCase.description,
    directionCase,
    signalBusExitPositions,
    simpleRouteJson,
    solverOptions,
  }
}
