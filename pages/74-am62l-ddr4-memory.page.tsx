import { FanoutDebugger } from "../lib/fanout-debugger"
import { createSample } from "../samples/74-am62l-ddr4-memory"

export default function Am62lDdr4MemoryFanoutPage() {
  return (
    <FanoutDebugger
      createSample={createSample}
      chipName="MT40A512M16LY-075:E"
      ballCount={96}
      packageLabel="96-ball x16 DDR4"
      signalLabel="DDR4 signals"
      directionLabel="memory fanout only"
    />
  )
}
