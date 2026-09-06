import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/24-rk3308-left-top-offset"

export default function Rk3308LeftTopOffsetPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
