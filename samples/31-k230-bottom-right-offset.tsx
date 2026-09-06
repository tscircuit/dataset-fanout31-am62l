import {
  K230FanoutCircuit,
  createK230FanoutSample,
} from "../lib/create-k230-fanout-sample"
export const exitPosition = "bottomside_right" as const
export const createSample = () => createK230FanoutSample(exitPosition)
export default function Sample() {
  return <K230FanoutCircuit exitPosition={exitPosition} />
}
