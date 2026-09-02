import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/04-right-top-offset"

export default function RightTopOffsetPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
