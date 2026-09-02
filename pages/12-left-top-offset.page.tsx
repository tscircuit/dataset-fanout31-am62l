import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/12-left-top-offset"

export default function LeftTopOffsetPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
