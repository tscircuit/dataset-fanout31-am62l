import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/67-am3352-bottom-right-offset"

export default function Am3352BottomRightOffsetPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
