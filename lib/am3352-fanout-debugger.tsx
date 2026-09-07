import type { Am3352FanoutSample } from "./create-am3352-fanout-sample"
import { FanoutDebugger } from "./fanout-debugger"
export function Am3352FanoutDebugger({
  createSample,
}: {
  createSample: () => Promise<Am3352FanoutSample>
}) {
  return (
    <FanoutDebugger
      createSample={createSample}
      chipName="TI AM3352BZCZD80"
      ballCount={324}
      directionLabel="bus exits on all four edges"
      signalLabel="signal/reference/regulator-output connections"
    />
  )
}
