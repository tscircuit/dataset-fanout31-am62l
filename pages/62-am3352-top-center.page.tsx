import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/62-am3352-top-center"

export default function Am3352TopCenterPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
