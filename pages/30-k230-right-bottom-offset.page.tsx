import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/30-k230-right-bottom-offset"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
