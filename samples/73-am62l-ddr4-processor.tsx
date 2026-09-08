import {
  Am62lDdr4FanoutCircuit,
  createAm62lDdr4FanoutSample,
} from "../lib/create-am62l-ddr4-fanout-sample"

export const exitPosition = "processor" as const

export default function Am62lDdr4ProcessorFanoutCircuit() {
  return <Am62lDdr4FanoutCircuit side="processor" />
}

export const createSample = () => createAm62lDdr4FanoutSample("processor")
