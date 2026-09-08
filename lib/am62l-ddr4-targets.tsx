import { Fragment } from "react"
import { AM62L_DDR4_PROCESSOR_BUSES } from "./am62l-ddr4-buses"

const TARGET_CONNECTION_ORDER = AM62L_DDR4_PROCESSOR_BUSES.flatMap(
  (bus) => bus.connections,
)

const TARGET_PIN_NUMBER_BY_CONNECTION = new Map(
  TARGET_CONNECTION_ORDER.map((connectionName, index) => [
    connectionName,
    index + 1,
  ]),
)

export function getAm62lDdr4TargetPinNumber(connectionName: string): number {
  const pinNumber = TARGET_PIN_NUMBER_BY_CONNECTION.get(connectionName)
  if (pinNumber === undefined) {
    throw new Error(`AM62L DDR4 target does not contain ${connectionName}`)
  }
  return pinNumber
}

export function Am62lDdr4Targets({ pcbX }: { pcbX: number }) {
  return (
    <connector
      name="J_TARGET"
      pcbX={pcbX}
      pcbY={0}
      footprint={
        <footprint>
          {TARGET_CONNECTION_ORDER.map((connectionName, index) => (
            <Fragment key={connectionName}>
              <smtpad
                portHints={[`pin${index + 1}`, connectionName]}
                pcbX={0}
                pcbY={(24 - index) * 0.3}
                radius="0.08mm"
                shape="circle"
              />
            </Fragment>
          ))}
        </footprint>
      }
    />
  )
}
