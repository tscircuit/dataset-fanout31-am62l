import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/17-rk3308-right-center"

export default function Rk3308RightCenterPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
