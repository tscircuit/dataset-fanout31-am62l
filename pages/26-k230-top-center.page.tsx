import { K230FanoutDebugger } from "../lib/k230-fanout-debugger"
import { createSample } from "../samples/26-k230-top-center"
export default function Page() {
  return <K230FanoutDebugger createSample={createSample} />
}
