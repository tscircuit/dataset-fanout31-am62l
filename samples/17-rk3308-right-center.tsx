import {
  Rk3308FanoutCircuit,
  createRk3308FanoutSample,
} from "../lib/create-rk3308-fanout-sample"

export const exitPosition = "rightside_center" as const

export default function Rk3308RightCenterCircuit() {
  return <Rk3308FanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () => createRk3308FanoutSample(exitPosition)
