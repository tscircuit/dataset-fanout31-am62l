import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/09-bottom-left-offset"

export default function BottomLeftOffsetPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
