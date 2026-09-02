import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/07-bottom-right-offset"

export default function BottomRightOffsetPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
