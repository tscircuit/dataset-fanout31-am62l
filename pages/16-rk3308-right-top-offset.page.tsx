import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/16-rk3308-right-top-offset"

export default function Rk3308RightTopOffsetPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
