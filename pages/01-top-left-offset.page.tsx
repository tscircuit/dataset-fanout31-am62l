import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/01-top-left-offset"

export default function TopLeftOffsetPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
