import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/19-rk3308-bottom-right-offset"

export default function Rk3308BottomRightOffsetPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
