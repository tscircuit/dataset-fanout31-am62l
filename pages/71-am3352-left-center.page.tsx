import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/71-am3352-left-center"

export default function Am3352LeftCenterPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
