import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/13-rk3308-top-left-offset"

export default function Rk3308TopLeftOffsetPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
