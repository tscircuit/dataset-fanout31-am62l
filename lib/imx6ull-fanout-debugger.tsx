import type { Imx6ullFanoutSample } from "./create-imx6ull-fanout-sample"
import { FanoutDebugger } from "./fanout-debugger"
import { IMX6ULL_PAD_POSITIONS } from "./imx6ull-footprint"

export function Imx6ullFanoutDebugger({
  createSample,
}: {
  createSample: () => Promise<Imx6ullFanoutSample>
}) {
  return (
    <FanoutDebugger
      createSample={createSample}
      chipName="NXP IMX6ULL"
      ballCount={IMX6ULL_PAD_POSITIONS.length}
    />
  )
}
