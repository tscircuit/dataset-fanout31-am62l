import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/33-k230-bottom-left-offset"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
