import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/35-k230-left-center"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
