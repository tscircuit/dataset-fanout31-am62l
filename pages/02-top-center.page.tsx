import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/02-top-center"

export default function TopCenterPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
