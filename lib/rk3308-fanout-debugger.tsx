import type { Rk3308FanoutSample } from "./create-rk3308-fanout-sample"
import { FanoutDebugger } from "./fanout-debugger"
import { RK3308_PAD_POSITIONS } from "./rk3308-footprint"

export function Rk3308FanoutDebugger({
  createSample,
}: {
  createSample: () => Promise<Rk3308FanoutSample>
}) {
  return (
    <FanoutDebugger
      createSample={createSample}
      chipName="Rockchip RK3308"
      ballCount={RK3308_PAD_POSITIONS.length}
    />
  )
}
