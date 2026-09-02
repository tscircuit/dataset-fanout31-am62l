import {
  Am62lFanoutCircuit,
  createAm62lFanoutSample,
} from "../lib/create-am62l-fanout-sample"

export const exitPosition = "rightside_top" as const

export default function RightTopOffsetCircuit() {
  return <Am62lFanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () =>
  createAm62lFanoutSample(exitPosition, <RightTopOffsetCircuit />)
