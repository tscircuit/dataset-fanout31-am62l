import { getSimpleRouteJsonFromCircuitJson, RootCircuit } from "@tscircuit/core"
import type {
  FanoutBusSpec,
  FanoutExitPosition,
  FanoutSolver,
  FanoutSolverOptions,
} from "@tscircuit/fanout-solver"
import { Fragment } from "react"
import { Am62l, getAm62lPinNumber } from "./am62l-footprint"
import {
  getFanoutDirectionCase,
  type Am62lFanoutDirectionCase,
} from "./fanout-directions"

export const SHARED_BOUNDARY = {
  minX: -8.5,
  maxX: 8.5,
  minY: -8.5,
  maxY: 8.5,
} as const

const CONNECTION_COUNT = 4
const TARGET_TRACK_PITCH = 0.35
type FanoutSimpleRouteJson = ConstructorParameters<typeof FanoutSolver>[0]

export interface Am62lFanoutSample {
  id: string
  name: string
  description: string
  directionCase: Am62lFanoutDirectionCase
  simpleRouteJson: FanoutSimpleRouteJson
  solverOptions: FanoutSolverOptions
}

function getBoundaryTarget(
  directionCase: Am62lFanoutDirectionCase,
  connectionIndex: number,
) {
  const trackOffset =
    (connectionIndex - (CONNECTION_COUNT - 1) / 2) * TARGET_TRACK_PITCH
  const bandCoordinate = directionCase.bandCoordinate + trackOffset

  switch (directionCase.exitEdge) {
    case "top":
      return { x: bandCoordinate, y: SHARED_BOUNDARY.maxY, layer: "top" }
    case "right":
      return { x: SHARED_BOUNDARY.maxX, y: bandCoordinate, layer: "top" }
    case "bottom":
      return { x: bandCoordinate, y: SHARED_BOUNDARY.minY, layer: "top" }
    case "left":
      return { x: SHARED_BOUNDARY.minX, y: bandCoordinate, layer: "top" }
  }
}

function findSourceComponentId(
  simpleRouteJson: FanoutSimpleRouteJson,
  connectionName: string,
): string {
  const sourceObstacle = simpleRouteJson.obstacles.find(
    (obstacle) =>
      obstacle.componentId !== undefined &&
      obstacle.connectedTo?.includes(connectionName) &&
      Math.abs(obstacle.center.x) <= 5.5 &&
      Math.abs(obstacle.center.y) <= 5.5,
  )
  if (!sourceObstacle?.componentId) {
    throw new Error(`Unable to identify the AM62L source for ${connectionName}`)
  }
  return sourceObstacle.componentId
}

export function createAm62lFanoutSample(
  exitPosition: Exclude<FanoutExitPosition, "center">,
): Am62lFanoutSample {
  const directionCase = getFanoutDirectionCase(exitPosition)
  const traceNames = directionCase.sourceBalls.map(
    (_, connectionIndex) => `FANOUT_${connectionIndex + 1}`,
  )
  const boundaryTargets = directionCase.sourceBalls.map((_, connectionIndex) =>
    getBoundaryTarget(directionCase, connectionIndex),
  )
  const circuit = new RootCircuit()

  circuit.add(
    <board width="24mm" height="24mm" layers={4} routingDisabled>
      <bus name="AM62L_FANOUT" connections={traceNames} />
      <Am62l />
      <chip
        name="J1"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            {boundaryTargets.map((target, connectionIndex) => (
              <Fragment key={`boundary-target-${connectionIndex + 1}`}>
                <smtpad
                  portHints={[`pin${connectionIndex + 1}`]}
                  pcbX={target.x}
                  pcbY={target.y}
                  radius="0.1mm"
                  shape="circle"
                />
              </Fragment>
            ))}
          </footprint>
        }
      />
      {directionCase.sourceBalls.map((ballName, connectionIndex) => (
        <Fragment key={`${directionCase.id}-${ballName}`}>
          <trace
            name={traceNames[connectionIndex]}
            from={`.U1 > .pin${getAm62lPinNumber(ballName)}`}
            to={`.J1 > .pin${connectionIndex + 1}`}
          />
        </Fragment>
      ))}
      <pcbnotetext
        pcbX={0}
        pcbY={-10.5}
        fontSize={0.7}
        text={`AM62L · ${directionCase.name}`}
      />
    </board>,
  )
  circuit.render()
  const board = circuit.firstChild
  if (!board) throw new Error("The TSX circuit did not emit its board")

  const { simpleRouteJson: renderedSimpleRouteJson } =
    getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: board,
    })
  const simpleRouteJson =
    renderedSimpleRouteJson as unknown as FanoutSimpleRouteJson
  const renderedBus = simpleRouteJson.buses?.find(
    (bus) => bus.busId === "AM62L_FANOUT",
  )
  if (!renderedBus)
    throw new Error("The TSX circuit did not emit its fanout bus")
  if (renderedBus.connectionNames.length !== CONNECTION_COUNT) {
    throw new Error(
      `Expected ${CONNECTION_COUNT} AM62L fanout connections, got ${renderedBus.connectionNames.length}`,
    )
  }

  const connectionByName = new Map(
    simpleRouteJson.connections.map((connection) => [
      connection.name,
      connection,
    ]),
  )
  const connectionExitTargets: Record<
    string,
    { x: number; y: number; layer: string }
  > = {}

  for (const [
    connectionIndex,
    connectionName,
  ] of renderedBus.connectionNames.entries()) {
    const connection = connectionByName.get(connectionName)
    if (!connection) {
      throw new Error(`Missing generated connection ${connectionName}`)
    }
    if (connection.pointsToConnect.length !== 2) {
      throw new Error(
        `Expected AM62L and boundary endpoints for ${connectionName}, got ${connection.pointsToConnect.length}`,
      )
    }
    const target = getBoundaryTarget(directionCase, connectionIndex)
    connectionExitTargets[connectionName] = target
  }

  const firstConnectionName = renderedBus.connectionNames[0]
  if (!firstConnectionName) throw new Error("The AM62L fanout bus is empty")
  const sourceComponentId = findSourceComponentId(
    simpleRouteJson,
    firstConnectionName,
  )
  simpleRouteJson.obstacles = simpleRouteJson.obstacles.filter(
    (obstacle) =>
      obstacle.componentId === undefined ||
      obstacle.componentId === sourceComponentId,
  )
  const bus: FanoutBusSpec = {
    ...renderedBus,
    sourceComponentId,
    exitPosition,
    allowedLayers: ["inner1", "inner2"],
    connectionExitTargets,
  }

  Object.assign(simpleRouteJson, {
    layerCount: 4,
    minTraceWidth: 0.08128,
    nominalTraceWidth: 0.08128,
    minViaPadDiameter: 0.3,
    minViaHoleDiameter: 0.15,
    minTraceToPadEdgeClearance: 0.06,
    minViaEdgeToPadEdgeClearance: 0.06,
    defaultObstacleMargin: 0.06,
    bounds: { ...SHARED_BOUNDARY },
    buses: [bus],
    allowBlindAndBuriedVias: false,
    allowViaInPad: false,
  })

  const solverOptions: FanoutSolverOptions = {
    buses: [bus],
    sharedBoundary: { ...SHARED_BOUNDARY },
    escapeLayers: ["inner1", "inner2"],
    traceWidth: 0.08128,
    viaDiameter: 0.3,
    viaHoleDiameter: 0.15,
    clearance: 0.06,
    compactBusTracks: true,
    singleLayerPushAndShove: true,
    borderDistribution: "even",
  }

  return {
    id: directionCase.id,
    name: directionCase.name,
    description: directionCase.description,
    directionCase,
    simpleRouteJson,
    solverOptions,
  }
}
