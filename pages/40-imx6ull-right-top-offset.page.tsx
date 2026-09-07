import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/40-imx6ull-right-top-offset"

export default function Imx6ullRightTopOffsetPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
