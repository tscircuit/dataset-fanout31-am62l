import { getSimpleRouteJsonFromCircuitJson, RootCircuit } from "@tscircuit/core"
import type {
  FanoutBusSpec,
  FanoutExitPosition,
  FanoutSolver,
  FanoutSolverOptions,
} from "@tscircuit/fanout-solver"
import { Fragment, type ReactElement } from "react"
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

export const SHARED_BOUNDARY = {
  minX: -8.62808,
  maxX: 8.62808,
  minY: -8.62808,
  maxY: 8.62808,
} as const

export const COMPLETE_CONNECTION_COUNT = 135
export const COMPLETE_BUS_COUNT = 111
export const SIGNAL_CONNECTION_COUNT = 33
export const PLANE_DROP_COUNT = 102

const TARGET_TRACK_PITCH = 0.25128
const BAND_CENTER_OFFSET = 4
type BoundaryExitPosition = Exclude<FanoutExitPosition, "center">
type FanoutSimpleRouteJson = ConstructorParameters<typeof FanoutSolver>[0]

interface SignalTarget {
  x: number
  y: number
  layer: string
  band: BusBand
}

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

const getTargetAcrossEdgeCoordinate = (
  directionCase: Am62lFanoutDirectionCase,
  band: BusBand,
  offset: number,
): number => {
  const orientation =
    directionCase.exitEdge === "right" || directionCase.exitEdge === "bottom"
      ? -1
      : 1
  return orientation * band * BAND_CENTER_OFFSET + offset
}

const placeTargetOnBoundary = (
  directionCase: Am62lFanoutDirectionCase,
  acrossEdgeCoordinate: number,
  layer: string,
  band: BusBand,
): SignalTarget => {
  switch (directionCase.exitEdge) {
    case "top":
      return {
        x: acrossEdgeCoordinate,
        y: SHARED_BOUNDARY.maxY,
        layer,
        band,
      }
    case "right":
      return {
        x: SHARED_BOUNDARY.maxX,
        y: acrossEdgeCoordinate,
        layer,
        band,
      }
    case "bottom":
      return {
        x: acrossEdgeCoordinate,
        y: SHARED_BOUNDARY.minY,
        layer,
        band,
      }
    case "left":
      return {
        x: SHARED_BOUNDARY.minX,
        y: acrossEdgeCoordinate,
        layer,
        band,
      }
  }
}

function createSignalTargets(
  directionCase: Am62lFanoutDirectionCase,
): ReadonlyMap<string, SignalTarget> {
  const connectionsByBand = new Map<
    BusBand,
    Array<{
      traceName: string
      layer: string
    }>
  >([
    [-1, []],
    [0, []],
    [1, []],
  ])

  for (const bus of AM62L_SIGNAL_BUSES) {
    const band = clampBand(bus.baseBand + directionCase.bandShift)
    const bandConnections = connectionsByBand.get(band)!
    for (const [connectionIndex, traceName] of bus.connections.entries()) {
      const layer =
        bus.preferredLayers[connectionIndex % bus.preferredLayers.length]
      if (!layer) throw new Error(`Missing preferred layer for ${traceName}`)
      bandConnections.push({ traceName, layer })
    }
  }

  const targets = new Map<string, SignalTarget>()
  for (const band of [-1, 0, 1] as const) {
    const bandConnections = connectionsByBand.get(band)!
    for (const [connectionIndex, connection] of bandConnections.entries()) {
      const offset =
        (connectionIndex - (bandConnections.length - 1) / 2) *
        TARGET_TRACK_PITCH
      const acrossEdgeCoordinate = getTargetAcrossEdgeCoordinate(
        directionCase,
        band,
        offset,
      )
      targets.set(
        connection.traceName,
        placeTargetOnBoundary(
          directionCase,
          acrossEdgeCoordinate,
          connection.layer,
          band,
        ),
      )
    }
  }
  return targets
}

const getPlaneDummyTarget = (connectionIndex: number) => ({
  x: 12 + (connectionIndex % 17) * 0.35,
  y: -10 + Math.floor(connectionIndex / 17) * 0.35,
})

const ORDERED_TRACE_CONNECTIONS = [
  ...AM62L_PLANE_DROPS.map((drop) => ({
    pinNumber: drop.pinNumber,
    traceName: drop.traceName,
  })),
  ...AM62L_SIGNAL_CONNECTIONS.map((connection) => ({
    pinNumber: connection.socPinNumber,
    traceName: connection.traceName,
  })),
]

const TARGET_PIN_NUMBER_BY_TRACE_NAME = new Map(
  ORDERED_TRACE_CONNECTIONS.map((connection, connectionIndex) => [
    connection.traceName,
    connectionIndex + 1,
  ]),
)

export function Am62lFanoutCircuit({
  exitPosition,
}: {
  exitPosition: BoundaryExitPosition
}) {
  const directionCase = getFanoutDirectionCase(exitPosition)
  const signalTargets = createSignalTargets(directionCase)
  const planeTargetByTraceName = new Map(
    AM62L_PLANE_DROPS.map((drop, connectionIndex) => [
      drop.traceName,
      getPlaneDummyTarget(connectionIndex),
    ]),
  )
  const targetByTraceName = new Map<string, { x: number; y: number }>([
    ...planeTargetByTraceName,
    ...[...signalTargets].map(
      ([traceName, target]) => [traceName, target] as const,
    ),
  ])

  return (
    <board
      width="40mm"
      height="40mm"
      layers={8}
      routingDisabled
      defaultTraceWidth="0.08128mm"
      minTraceWidth="0.08128mm"
      minTraceToPadEdgeClearance="0.05mm"
      minViaEdgeToPadEdgeClearance="0.08128mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
      minViaHoleDiameter="0.1mm"
      minViaPadDiameter="0.24mm"
      allowBlindAndBuriedVias={false}
      isViaInPadAllowed={false}
    >
      <net name="GND" />
      <net name="VDD_LPDDR4" />
      {AM62L_PLANE_DROPS.map((drop) => (
        <Fragment key={`plane-bus-${drop.traceName}`}>
          <bus name={drop.traceName} connections={[drop.traceName]} />
        </Fragment>
      ))}
      {AM62L_SIGNAL_BUSES.map((bus) => (
        <Fragment key={`signal-bus-${bus.name}`}>
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
      <Am62l />
      <chip
        name="J1"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            {ORDERED_TRACE_CONNECTIONS.map((connection, connectionIndex) => {
              const target = targetByTraceName.get(connection.traceName)
              if (!target) {
                throw new Error(`Missing target for ${connection.traceName}`)
              }
              return (
                <Fragment key={`target-${connection.traceName}`}>
                  <smtpad
                    portHints={[`pin${connectionIndex + 1}`]}
                    pcbX={target.x}
                    pcbY={target.y}
                    radius="0.1mm"
                    shape="circle"
                  />
                </Fragment>
              )
            })}
          </footprint>
        }
      />
      {ORDERED_TRACE_CONNECTIONS.map((connection) => {
        const targetPinNumber = TARGET_PIN_NUMBER_BY_TRACE_NAME.get(
          connection.traceName,
        )
        if (!targetPinNumber) {
          throw new Error(`Missing target pin for ${connection.traceName}`)
        }
        return (
          <Fragment key={`trace-${connection.traceName}`}>
            <trace
              name={connection.traceName}
              from={`.U1 > .pin${connection.pinNumber}`}
              to={`.J1 > .pin${targetPinNumber}`}
            />
          </Fragment>
        )
      })}
      <pcbnotetext
        pcbX={0}
        pcbY={-11.5}
        fontSize={0.7}
        text={`AM62L · ${directionCase.name} · 135 connections`}
      />
    </board>
  )
}

function getRequiredRenderedBus(
  simpleRouteJson: FanoutSimpleRouteJson,
  busId: string,
) {
  const bus = simpleRouteJson.buses?.find(
    (candidate) => candidate.busId === busId,
  )
  if (!bus) throw new Error(`The TSX circuit did not emit bus ${busId}`)
  return bus
}

function getSourceComponentId(simpleRouteJson: FanoutSimpleRouteJson): string {
  const sourceObstacle = simpleRouteJson.obstacles.find(
    (obstacle) =>
      obstacle.componentId !== undefined &&
      Math.abs(obstacle.center.x) <= 5.5 &&
      Math.abs(obstacle.center.y) <= 5.5,
  )
  if (!sourceObstacle?.componentId) {
    throw new Error("Unable to identify the TSX-generated AM62L component")
  }
  return sourceObstacle.componentId
}

export function createAm62lFanoutSample(
  exitPosition: BoundaryExitPosition,
  circuitElement?: ReactElement,
): Am62lFanoutSample {
  const directionCase = getFanoutDirectionCase(exitPosition)
  const signalTargets = createSignalTargets(directionCase)
  const circuit = new RootCircuit()
  circuit.add(
    circuitElement ?? <Am62lFanoutCircuit exitPosition={exitPosition} />,
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
  const sourceComponentId = getSourceComponentId(simpleRouteJson)
  const connectionByName = new Map(
    simpleRouteJson.connections.map((connection) => [
      connection.name,
      connection,
    ]),
  )
  const connectionNameByTraceName = new Map<string, string>()
  const buses: FanoutBusSpec[] = []
  const busDirections: Record<string, "up" | "right" | "down" | "left"> = {}

  for (const drop of AM62L_PLANE_DROPS) {
    const renderedBus = getRequiredRenderedBus(simpleRouteJson, drop.traceName)
    const connectionName = renderedBus.connectionNames[0]
    if (!connectionName || renderedBus.connectionNames.length !== 1) {
      throw new Error(`Plane bus ${drop.traceName} must contain one connection`)
    }
    const connection = connectionByName.get(connectionName)
    if (!connection)
      throw new Error(`Missing plane connection ${connectionName}`)
    const sourcePoint = connection.pointsToConnect.find((point) =>
      (point as { port_selector?: string }).port_selector?.startsWith("U1."),
    )
    if (!sourcePoint)
      throw new Error(`Missing AM62L endpoint for ${drop.traceName}`)
    connection.pointsToConnect = [sourcePoint]
    connection.netConnectionName = drop.netName
    connection.nominalTraceWidth = 0.08128
    connectionNameByTraceName.set(drop.traceName, connectionName)
    buses.push({
      busId: drop.traceName,
      connectionNames: [connectionName],
      termination: { type: "plane", layer: drop.layer },
    })
    busDirections[drop.traceName] = drop.direction
  }

  const signalBusExitPositions = {} as Record<DdrBusName, BoundaryExitPosition>
  for (const busDefinition of AM62L_SIGNAL_BUSES) {
    const renderedBus = getRequiredRenderedBus(
      simpleRouteJson,
      busDefinition.name,
    )
    if (
      renderedBus.connectionNames.length !== busDefinition.connections.length
    ) {
      throw new Error(
        `${busDefinition.name} emitted ${renderedBus.connectionNames.length} connections; expected ${busDefinition.connections.length}`,
      )
    }
    const connectionExitTargets: Record<
      string,
      { x: number; y: number; layer: string }
    > = {}
    for (const [
      connectionIndex,
      traceName,
    ] of busDefinition.connections.entries()) {
      const connectionName = renderedBus.connectionNames[connectionIndex]
      if (!connectionName)
        throw new Error(`Missing connection for ${traceName}`)
      const connection = connectionByName.get(connectionName)
      const target = signalTargets.get(traceName)
      if (!connection || !target) {
        throw new Error(
          `Missing generated connection or target for ${traceName}`,
        )
      }
      const targetPoint = connection.pointsToConnect.find((point) =>
        (point as { port_selector?: string }).port_selector?.startsWith("J1."),
      )
      if (!targetPoint)
        throw new Error(`Missing boundary endpoint for ${traceName}`)
      Object.assign(targetPoint, {
        x: target.x,
        y: target.y,
        layer: target.layer,
      })
      connection.nominalTraceWidth = 0.08128
      connectionExitTargets[connectionName] = {
        x: target.x,
        y: target.y,
        layer: target.layer,
      }
      connectionNameByTraceName.set(traceName, connectionName)
    }
    const busExitPosition = getSignalBusExitPosition(
      directionCase,
      busDefinition.name,
    )
    signalBusExitPositions[busDefinition.name] = busExitPosition
    buses.push({
      busId: busDefinition.name,
      connectionNames: [...renderedBus.connectionNames],
      sourceComponentId,
      exitPosition: busExitPosition,
      allowedLayers: [...busDefinition.preferredLayers],
      maxLengthSkew:
        "maxLengthSkew" in busDefinition
          ? busDefinition.maxLengthSkew
          : undefined,
      connectionExitTargets,
    })
  }

  simpleRouteJson.obstacles = simpleRouteJson.obstacles.filter(
    (obstacle) => obstacle.componentId === sourceComponentId,
  )
  simpleRouteJson.buses = buses
  simpleRouteJson.differentialPairs = AM62L_DIFFERENTIAL_PAIRS.map((pair) => {
    const positiveConnection = connectionNameByTraceName.get(
      pair.positiveConnection,
    )
    const negativeConnection = connectionNameByTraceName.get(
      pair.negativeConnection,
    )
    if (!positiveConnection || !negativeConnection) {
      throw new Error(`Missing generated connections for ${pair.name}`)
    }
    return {
      connectionNames: [positiveConnection, negativeConnection],
      lengthTolerance: pair.lengthTolerance,
    }
  })

  Object.assign(simpleRouteJson, {
    layerCount: 8,
    minTraceWidth: 0.08128,
    nominalTraceWidth: 0.08128,
    minViaDiameter: 0.24,
    minViaPadDiameter: 0.24,
    minViaHoleDiameter: 0.1,
    min_via_hole_diameter: 0.1,
    min_via_pad_diameter: 0.24,
    minTraceToPadEdgeClearance: 0.05,
    minViaEdgeToPadEdgeClearance: 0.08128,
    minViaHoleEdgeToViaHoleEdgeClearance: 0.1016,
    minPlatedHoleDrillEdgeToDrillEdgeClearance: 0.15,
    minPadEdgeToPadEdgeClearance: 0.1,
    minBoardEdgeClearance: 0.2,
    bounds: { ...SHARED_BOUNDARY },
    allowBlindAndBuriedVias: false,
    allowViaInPad: false,
  })

  if (simpleRouteJson.connections.length !== COMPLETE_CONNECTION_COUNT) {
    throw new Error(
      `Expected ${COMPLETE_CONNECTION_COUNT} connections, got ${simpleRouteJson.connections.length}`,
    )
  }
  if (simpleRouteJson.obstacles.length !== 373) {
    throw new Error(
      `Expected all 373 AM62L pad obstacles, got ${simpleRouteJson.obstacles.length}`,
    )
  }
  if (buses.length !== COMPLETE_BUS_COUNT) {
    throw new Error(`Expected ${COMPLETE_BUS_COUNT} buses, got ${buses.length}`)
  }

  const solverOptions: FanoutSolverOptions = {
    buses,
    borderDistribution: "even",
    compactBusTracks: true,
    busDirections,
    escapeLayers: ["top", "inner4", "inner5", "inner6", "bottom"],
    allowBlindAndBuriedVias: false,
    sharedBoundary: { ...SHARED_BOUNDARY },
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
