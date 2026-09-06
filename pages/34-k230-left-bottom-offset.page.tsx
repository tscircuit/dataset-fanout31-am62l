import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/34-k230-left-bottom-offset"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
