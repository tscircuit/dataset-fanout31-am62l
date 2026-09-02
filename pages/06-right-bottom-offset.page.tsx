import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/06-right-bottom-offset"

export default function RightBottomOffsetPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
