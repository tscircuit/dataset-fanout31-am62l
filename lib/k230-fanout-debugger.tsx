import type { K230FanoutSample } from "./create-k230-fanout-sample"
import { FanoutDebugger } from "./fanout-debugger"
export function K230FanoutDebugger({
  createSample,
}: {
  createSample: () => Promise<K230FanoutSample>
}) {
  return (
    <FanoutDebugger
      createSample={createSample}
      chipName="Canaan K230"
      ballCount={390}
    />
  )
}
