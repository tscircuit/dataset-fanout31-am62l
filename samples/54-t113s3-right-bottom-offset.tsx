import {
  T113s3FanoutCircuit,
  createT113s3FanoutSample,
} from "../lib/create-t113s3-fanout-sample"

export const exitPosition = "rightside_bottom" as const

export default function T113s3RightBottomOffsetCircuit() {
  return <T113s3FanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () => createT113s3FanoutSample(exitPosition)
