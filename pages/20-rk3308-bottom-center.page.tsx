import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/20-rk3308-bottom-center"

export default function Rk3308BottomCenterPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
