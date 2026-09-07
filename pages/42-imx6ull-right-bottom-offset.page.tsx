import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/42-imx6ull-right-bottom-offset"

export default function Imx6ullRightBottomOffsetPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
