import { Imx6ullFanoutDebugger } from "../lib/imx6ull-fanout-debugger"
import { createSample } from "../samples/48-imx6ull-left-top-offset"

export default function Imx6ullLeftTopOffsetPage() {
  return <Imx6ullFanoutDebugger createSample={createSample} />
}
