import {
  Am62lFanoutCircuit,
  createAm62lFanoutSample,
} from "../lib/create-am62l-fanout-sample"

export const exitPosition = "leftside_top" as const

export default function LeftTopOffsetCircuit() {
  return <Am62lFanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () => createAm62lFanoutSample(exitPosition)
