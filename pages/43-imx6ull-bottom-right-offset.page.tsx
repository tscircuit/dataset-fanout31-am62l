import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/43-imx6ull-bottom-right-offset"

export default function Imx6ullBottomRightOffsetPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
