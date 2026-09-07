import {
  Imx6ullFanoutCircuit,
  createImx6ullFanoutSample,
} from "../lib/create-imx6ull-fanout-sample"

export const exitPosition = "bottomside_left" as const

export default function Imx6ullBottomLeftOffsetCircuit() {
  return <Imx6ullFanoutCircuit exitPosition={exitPosition} />
}

export const createSample = () => createImx6ullFanoutSample(exitPosition)
