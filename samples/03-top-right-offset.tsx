import {
  Am62lFanoutCircuit,
  createAm62lFanoutSample,
} from "../lib/create-am62l-fanout-sample"

export const exitPosition = "topside_right" as const

export default function TopRightOffsetCircuit() {
  return <Am62lFanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () =>
  createAm62lFanoutSample(exitPosition, <TopRightOffsetCircuit />)
