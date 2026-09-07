import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/65-am3352-right-center"

export default function Am3352RightCenterPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
