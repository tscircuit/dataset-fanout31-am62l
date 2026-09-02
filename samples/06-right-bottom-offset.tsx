import {
  Am62lFanoutCircuit,
  createAm62lFanoutSample,
} from "../lib/create-am62l-fanout-sample"

export const exitPosition = "rightside_bottom" as const

export default function RightBottomOffsetCircuit() {
  return <Am62lFanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () => createAm62lFanoutSample(exitPosition)
