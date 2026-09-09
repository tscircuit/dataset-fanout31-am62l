import {
  Am62lDdr4FanoutCircuit,
  createAm62lDdr4FanoutSample,
} from "../lib/create-am62l-ddr4-fanout-sample"

export const exitPosition = "memory" as const

export default function Am62lDdr4MemoryFanoutCircuit() {
  return <Am62lDdr4FanoutCircuit side="memory" />
}

export const createSample = () => createAm62lDdr4FanoutSample("memory")
