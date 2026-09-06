import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/36-k230-left-top-offset"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
