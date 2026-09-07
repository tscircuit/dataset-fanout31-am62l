import type { T113s3FanoutSample } from "./create-t113s3-fanout-sample"
import { FanoutDebugger } from "./fanout-debugger"
export function T113s3FanoutDebugger({
  createSample,
}: {
  createSample: () => Promise<T113s3FanoutSample>
}) {
  return (
    <FanoutDebugger
      createSample={createSample}
      chipName="Allwinner T113-S3"
      ballCount={129}
      packageLabel="128 pins + exposed pad ·"
      directionLabel="bus exits on all four edges"
      signalLabel="signal/reference/regulator-output connections"
    />
  )
}
