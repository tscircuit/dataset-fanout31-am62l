import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/28-k230-right-top-offset"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
