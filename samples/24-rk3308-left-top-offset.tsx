import {
  Rk3308FanoutCircuit,
  createRk3308FanoutSample,
} from "../lib/create-rk3308-fanout-sample"

export const exitPosition = "leftside_top" as const

export default function Rk3308LeftTopOffsetCircuit() {
  return <Rk3308FanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () => createRk3308FanoutSample(exitPosition)
