import { Am3352FanoutDebugger } from "../lib/am3352-fanout-debugger"
import { createSample } from "../samples/61-am3352-top-left-offset"

export default function Am3352TopLeftOffsetPage() {
  return <Am3352FanoutDebugger createSample={createSample} />
}
