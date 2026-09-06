import { AM62L_PAD_POSITIONS } from "./am62l-footprint"
import type { Am62lFanoutSample } from "./create-am62l-fanout-sample"
import { FanoutDebugger } from "./fanout-debugger"

export function Am62lFanoutDebugger({
  createSample,
}: {
  createSample: () => Promise<Am62lFanoutSample>
}) {
  return (
    <FanoutDebugger
      createSample={createSample}
      chipName="AM62L32BOGHAANBR"
      ballCount={AM62L_PAD_POSITIONS.length}
    />
  )
}
