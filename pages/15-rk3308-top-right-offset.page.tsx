import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/15-rk3308-top-right-offset"

export default function Rk3308TopRightOffsetPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
