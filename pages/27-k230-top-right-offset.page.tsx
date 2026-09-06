import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/27-k230-top-right-offset"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
