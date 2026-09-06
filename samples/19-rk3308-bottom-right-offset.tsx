import {
  Rk3308FanoutCircuit,
  createRk3308FanoutSample,
} from "../lib/create-rk3308-fanout-sample"

export const exitPosition = "bottomside_right" as const

export default function Rk3308BottomRightOffsetCircuit() {
  return <Rk3308FanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () => createRk3308FanoutSample(exitPosition)
