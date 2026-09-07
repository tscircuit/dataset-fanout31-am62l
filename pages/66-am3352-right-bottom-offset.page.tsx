import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/66-am3352-right-bottom-offset"

export default function Am3352RightBottomOffsetPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
