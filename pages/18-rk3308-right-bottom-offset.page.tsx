import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/18-rk3308-right-bottom-offset"

export default function Rk3308RightBottomOffsetPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
