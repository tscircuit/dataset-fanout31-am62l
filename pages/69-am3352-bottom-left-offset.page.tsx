import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/69-am3352-bottom-left-offset"

export default function Am3352BottomLeftOffsetPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
