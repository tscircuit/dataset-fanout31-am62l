import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/37-imx6ull-top-left-offset"

export default function Imx6ullTopLeftOffsetPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
