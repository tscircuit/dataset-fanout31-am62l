import {
  Am3352FanoutCircuit,
  createAm3352FanoutSample,
} from "../lib/create-am3352-fanout-sample"

export const exitPosition = "bottomside_center" as const

export default function Am3352BottomCenterCircuit() {
  return <Am3352FanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () => createAm3352FanoutSample(exitPosition)
