import {
  Am62lFanoutCircuit,
  createAm62lFanoutSample,
} from "../lib/create-am62l-fanout-sample"

export const exitPosition = "leftside_center" as const

export default function LeftCenterCircuit() {
  return <Am62lFanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () =>
  createAm62lFanoutSample(exitPosition, <LeftCenterCircuit />)
