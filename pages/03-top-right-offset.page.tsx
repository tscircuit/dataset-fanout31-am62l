import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/03-top-right-offset"

export default function TopRightOffsetPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
