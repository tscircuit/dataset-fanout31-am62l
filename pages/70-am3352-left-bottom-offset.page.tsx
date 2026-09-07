import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/70-am3352-left-bottom-offset"

export default function Am3352LeftBottomOffsetPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
