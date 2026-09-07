import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/68-am3352-bottom-center"

export default function Am3352BottomCenterPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
