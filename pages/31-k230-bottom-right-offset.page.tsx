import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/31-k230-bottom-right-offset"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
