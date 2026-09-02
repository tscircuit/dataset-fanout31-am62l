import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/10-left-bottom-offset"

export default function LeftBottomOffsetPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
