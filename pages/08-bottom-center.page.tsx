import { Am62lFanoutDebugger } from "../lib/am62l-fanout-debugger"
import { createSample } from "../samples/08-bottom-center"

export default function BottomCenterPage() {
  return <Am62lFanoutDebugger createSample={createSample} />
}
