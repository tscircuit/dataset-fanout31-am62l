import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/64-am3352-right-top-offset"

export default function Am3352RightTopOffsetPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
