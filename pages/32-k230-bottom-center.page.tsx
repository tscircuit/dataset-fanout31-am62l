import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/32-k230-bottom-center"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
