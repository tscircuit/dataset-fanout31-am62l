import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/45-imx6ull-bottom-left-offset"

export default function Imx6ullBottomLeftOffsetPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
