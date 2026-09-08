import { FanoutDebugger } from "../lib/fanout-debugger"
import { createSample } from "../samples/73-am62l-ddr4-processor"

export default function Am62lDdr4ProcessorFanoutPage() {
  return (
    <FanoutDebugger
      createSample={createSample}
      chipName="AM62L32BEGHAANBR"
      ballCount={373}
      packageLabel="373-ball AM62L + 96-ball x16 DDR4"
      signalLabel="DDR4 signals"
      directionLabel="processor fanout only"
    />
  )
}
