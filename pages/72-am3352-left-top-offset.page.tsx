import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/72-am3352-left-top-offset"

export default function Am3352LeftTopOffsetPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
