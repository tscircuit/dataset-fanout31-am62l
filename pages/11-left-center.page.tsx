import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/11-left-center"

export default function LeftCenterPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
