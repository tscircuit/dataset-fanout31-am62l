import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/21-rk3308-bottom-left-offset"

export default function Rk3308BottomLeftOffsetPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
