import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/05-right-center"

export default function RightCenterPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
