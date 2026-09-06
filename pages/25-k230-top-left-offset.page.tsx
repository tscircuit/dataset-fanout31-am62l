import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/25-k230-top-left-offset"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
