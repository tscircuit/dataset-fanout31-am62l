import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/46-imx6ull-left-bottom-offset"

export default function Imx6ullLeftBottomOffsetPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
