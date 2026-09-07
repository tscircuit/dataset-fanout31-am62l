import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/63-am3352-top-right-offset"

export default function Am3352TopRightOffsetPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
