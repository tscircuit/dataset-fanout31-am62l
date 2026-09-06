import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/29-k230-right-center"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
