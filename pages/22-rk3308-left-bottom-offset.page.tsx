import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/22-rk3308-left-bottom-offset"

export default function Rk3308LeftBottomOffsetPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
