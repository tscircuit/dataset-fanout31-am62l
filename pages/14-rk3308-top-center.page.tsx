import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/14-rk3308-top-center"

export default function Rk3308TopCenterPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
