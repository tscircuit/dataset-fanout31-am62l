import { Rk3308FanoutDebugger } from "../lib/rk3308-fanout-debugger"
import { createSample } from "../samples/23-rk3308-left-center"

export default function Rk3308LeftCenterPage() {
  return <Rk3308FanoutDebugger createSample={createSample} />
}
